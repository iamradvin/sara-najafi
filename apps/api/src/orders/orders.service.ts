import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  CourseStatus,
  EnrollmentStatus,
  EnrollmentSource,
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
  Prisma,
} from "@prisma/client";
import { randomBytes } from "node:crypto";
import { getWebOrigins } from "../common/web-origins";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCheckoutDto } from "./checkout.dto";

type ZarinpalResponse = {
  data?: {
    code?: number;
    authority?: string;
    ref_id?: number | string;
  };
  errors?: unknown;
};

const orderSummary = {
  items: { select: { courseId: true, courseTitle: true, unitPriceToman: true } },
  payments: {
    select: {
      status: true,
      provider: true,
      providerTransactionId: true,
      createdAt: true,
      verifiedAt: true,
    },
  },
} satisfies Prisma.OrderInclude;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  get webOrigin(): string {
    return getWebOrigins(this.config)[0];
  }

  async createCheckout(userId: string, input: CreateCheckoutDto) {
    const courses = await this.prisma.course.findMany({
      where: {
        slug: { in: input.courseSlugs },
        status: CourseStatus.PUBLISHED,
        deletedAt: null,
      },
      select: { id: true, slug: true, title: true, priceToman: true, isFree: true },
    });

    if (courses.length !== input.courseSlugs.length) {
      throw new NotFoundException("یک یا چند دوره در دسترس نیست.");
    }

    const existingEnrollments = await this.prisma.enrollment.findMany({
      where: {
        userId,
        courseId: { in: courses.map((course) => course.id) },
        status: EnrollmentStatus.ACTIVE,
      },
      select: { courseId: true },
    });
    if (existingEnrollments.length) {
      throw new ConflictException("برای یک یا چند دوره قبلاً دسترسی فعال داری.");
    }

    const items = courses.map((course) => {
      if (!course.isFree && (course.priceToman === null || course.priceToman < 1)) {
        throw new BadRequestException(`قیمت دوره «${course.title}» هنوز مشخص نشده است.`);
      }
      return {
        courseId: course.id,
        courseTitle: course.title,
        unitPriceToman: course.isFree ? 0 : course.priceToman!,
      };
    });
    const totalToman = items.reduce((total, item) => total + item.unitPriceToman, 0);
    if (!Number.isSafeInteger(totalToman) || totalToman > 2_000_000_000) {
      throw new BadRequestException("مبلغ سفارش از محدوده مجاز بیشتر است.");
    }

    if (courses.every((course) => course.isFree)) {
      await this.prisma.$transaction(async (transaction) => {
        for (const item of items) {
          const enrollment = await transaction.enrollment.upsert({
            where: { userId_courseId: { userId, courseId: item.courseId } },
            update: {
              status: EnrollmentStatus.ACTIVE,
              source: EnrollmentSource.FREE,
              enrolledAt: new Date(),
              expiresAt: null,
            },
            create: {
              userId,
              courseId: item.courseId,
              source: EnrollmentSource.FREE,
            },
          });
          await transaction.enrollmentHistory.create({
            data: {
              enrollmentId: enrollment.id,
              actorId: userId,
              status: EnrollmentStatus.ACTIVE,
              source: EnrollmentSource.FREE,
              reason: "ثبت‌نام رایگان",
            },
          });
        }
      });
      return { type: "enrolled" as const, courseSlugs: courses.map((course) => course.slug) };
    }

    const gateway = this.getGatewayConfig();
    const orderNumber = `AS-${Date.now().toString(36).toUpperCase()}-${randomBytes(5).toString("hex").toUpperCase()}`;
    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        userId,
        subtotalToman: totalToman,
        totalToman,
        items: { create: items },
        payments: {
          create: {
            provider: PaymentProvider.ZARINPAL,
            amountToman: totalToman,
          },
        },
      },
      include: { payments: { select: { id: true } } },
    });
    const paymentId = order.payments[0]?.id;
    if (!paymentId) throw new ServiceUnavailableException("ثبت پرداخت سفارش انجام نشد.");

    try {
      const authority = await this.requestZarinpalPayment({
        merchantId: gateway.merchantId,
        callbackUrl: gateway.callbackUrl,
        amountRial: totalToman * 10,
        description: items.map((item) => item.courseTitle).join("، ").slice(0, 250),
        sandbox: gateway.sandbox,
      });
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: { providerAuthority: authority },
      });

      const paymentBase = gateway.sandbox
        ? "https://sandbox.zarinpal.com"
        : "https://payment.zarinpal.com";
      return {
        type: "payment" as const,
        orderNumber,
        paymentUrl: `${paymentBase}/pg/StartPay/${encodeURIComponent(authority)}`,
      };
    } catch (error) {
      await this.prisma.$transaction([
        this.prisma.payment.updateMany({
          where: { id: paymentId, status: PaymentStatus.PENDING },
          data: { status: PaymentStatus.FAILED },
        }),
        this.prisma.order.updateMany({
          where: { id: order.id, status: OrderStatus.PENDING },
          data: { status: OrderStatus.CANCELLED },
        }),
      ]);
      throw error;
    }
  }

  listOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: orderSummary,
    });
  }

  async findOrder(userId: string, orderNumber: string) {
    const order = await this.prisma.order.findFirst({
      where: { userId, orderNumber },
      include: orderSummary,
    });
    if (!order) throw new NotFoundException("سفارش پیدا نشد.");
    return order;
  }

  async completeZarinpalCallback(authority: string | undefined, status: string | undefined) {
    if (!authority || !/^[A-Za-z0-9-]{1,36}$/.test(authority)) {
      return { status: "failed" as const };
    }

    const payment = await this.prisma.payment.findUnique({
      where: { providerAuthority: authority },
      include: { order: { include: { items: true } } },
    });
    if (!payment || payment.provider !== PaymentProvider.ZARINPAL) {
      return { status: "failed" as const };
    }
    if (payment.status === PaymentStatus.SUCCESS || payment.order.status === OrderStatus.PAID) {
      return { status: "success" as const, orderNumber: payment.order.orderNumber };
    }

    if (status !== "OK" || payment.status !== PaymentStatus.PENDING) {
      await this.failPendingPayment(payment.id, payment.order.id);
      return { status: "failed" as const, orderNumber: payment.order.orderNumber };
    }

    const gateway = this.getGatewayConfig();
    const verification = await this.verifyZarinpalPayment(
      gateway.merchantId,
      payment.amountToman * 10,
      authority,
      gateway.sandbox,
    );
    if (![100, 101].includes(verification.data?.code ?? 0)) {
      await this.failPendingPayment(payment.id, payment.order.id);
      return { status: "failed" as const, orderNumber: payment.order.orderNumber };
    }

    const transactionId = verification.data?.ref_id;
    await this.prisma.$transaction(async (transaction) => {
      const claim = await transaction.payment.updateMany({
        where: { id: payment.id, status: PaymentStatus.PENDING },
        data: {
          status: PaymentStatus.SUCCESS,
          providerTransactionId: transactionId === undefined ? null : String(transactionId),
          verifiedAt: new Date(),
        },
      });
      if (!claim.count) return;

      const paid = await transaction.order.updateMany({
        where: { id: payment.order.id, status: OrderStatus.PENDING },
        data: { status: OrderStatus.PAID, paidAt: new Date() },
      });
      if (!paid.count) {
        throw new ConflictException("وضعیت سفارش هم‌زمان تغییر کرده است.");
      }

      for (const item of payment.order.items) {
        await transaction.enrollment.upsert({
          where: { userId_courseId: { userId: payment.order.userId, courseId: item.courseId } },
          update: {
            status: EnrollmentStatus.ACTIVE,
            source: EnrollmentSource.PAYMENT,
            enrolledAt: new Date(),
            expiresAt: null,
          },
          create: {
            userId: payment.order.userId,
            courseId: item.courseId,
            source: EnrollmentSource.PAYMENT,
          },
        });
        const enrollment = await transaction.enrollment.findUniqueOrThrow({
          where: {
            userId_courseId: {
              userId: payment.order.userId,
              courseId: item.courseId,
            },
          },
          select: { id: true },
        });
        await transaction.enrollmentHistory.create({
          data: {
            enrollmentId: enrollment.id,
            status: EnrollmentStatus.ACTIVE,
            source: EnrollmentSource.PAYMENT,
            reason: `تأیید پرداخت سفارش ${payment.order.orderNumber}`,
          },
        });
      }
    });

    const latest = await this.prisma.payment.findUnique({
      where: { id: payment.id },
      select: { status: true },
    });
    return latest?.status === PaymentStatus.SUCCESS
      ? { status: "success" as const, orderNumber: payment.order.orderNumber }
      : { status: "failed" as const, orderNumber: payment.order.orderNumber };
  }

  private async failPendingPayment(paymentId: string, orderId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.payment.updateMany({
        where: { id: paymentId, status: PaymentStatus.PENDING },
        data: { status: PaymentStatus.FAILED },
      }),
      this.prisma.order.updateMany({
        where: { id: orderId, status: OrderStatus.PENDING },
        data: { status: OrderStatus.CANCELLED },
      }),
    ]);
  }

  private getGatewayConfig(): { merchantId: string; callbackUrl: string; sandbox: boolean } {
    const merchantId = this.config.get<string>("ZARINPAL_MERCHANT_ID");
    const callbackUrl = this.config.get<string>("ZARINPAL_CALLBACK_URL");
    if (!merchantId || !callbackUrl) {
      throw new ServiceUnavailableException("تنظیمات درگاه زرین‌پال کامل نشده است.");
    }
    if (!/^[a-f0-9-]{36}$/i.test(merchantId)) {
      throw new ServiceUnavailableException("شناسه پذیرنده زرین‌پال معتبر نیست.");
    }

    let parsedCallback: URL;
    try {
      parsedCallback = new URL(callbackUrl);
    } catch {
      throw new ServiceUnavailableException("نشانی بازگشت زرین‌پال معتبر نیست.");
    }
    const production = this.config.get<string>("NODE_ENV") === "production";
    if (parsedCallback.protocol !== "https:" && production) {
      throw new ServiceUnavailableException("نشانی بازگشت پرداخت در محیط عملیاتی باید HTTPS باشد.");
    }
    if (parsedCallback.protocol !== "https:" && parsedCallback.protocol !== "http:") {
      throw new ServiceUnavailableException("پروتکل نشانی بازگشت پرداخت معتبر نیست.");
    }

    return {
      merchantId,
      callbackUrl: parsedCallback.toString(),
      sandbox: this.config.get<string>("ZARINPAL_SANDBOX", "true") !== "false",
    };
  }

  private async requestZarinpalPayment(input: {
    merchantId: string;
    callbackUrl: string;
    amountRial: number;
    description: string;
    sandbox: boolean;
  }): Promise<string> {
    const result = await this.callZarinpal(
      input.sandbox,
      "request",
      {
        merchant_id: input.merchantId,
        amount: input.amountRial,
        callback_url: input.callbackUrl,
        description: input.description,
      },
    );
    const authority = result.data?.authority;
    if (result.data?.code !== 100 || !authority || !/^[A-Za-z0-9-]{1,36}$/.test(authority)) {
      throw new ServiceUnavailableException("درخواست پرداخت توسط زرین‌پال تأیید نشد.");
    }
    return authority;
  }

  private verifyZarinpalPayment(
    merchantId: string,
    amountRial: number,
    authority: string,
    sandbox: boolean,
  ) {
    return this.callZarinpal(sandbox, "verify", {
      merchant_id: merchantId,
      amount: amountRial,
      authority,
    });
  }

  private async callZarinpal(
    sandbox: boolean,
    operation: "request" | "verify",
    body: Record<string, string | number>,
  ): Promise<ZarinpalResponse> {
    const baseUrl = sandbox
      ? "https://sandbox.zarinpal.com/pg/v4/payment"
      : "https://payment.zarinpal.com/pg/v4/payment";
    let response: Response;
    try {
      response = await fetch(`${baseUrl}/${operation}.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      throw new ServiceUnavailableException("ارتباط با درگاه زرین‌پال برقرار نشد.");
    }

    let result: ZarinpalResponse;
    try {
      result = (await response.json()) as ZarinpalResponse;
    } catch {
      throw new ServiceUnavailableException("پاسخ درگاه زرین‌پال قابل خواندن نیست.");
    }
    if (!response.ok) {
      throw new ServiceUnavailableException("درگاه زرین‌پال موقتاً در دسترس نیست.");
    }
    return result;
  }
}
