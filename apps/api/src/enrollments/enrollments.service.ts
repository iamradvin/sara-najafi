import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { EnrollmentSource, EnrollmentStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ManualEnrollmentDto } from "./enrollment.dto";

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  listMine(userId: string) {
    return this.prisma.enrollment.findMany({
      where: { userId },
      orderBy: { enrolledAt: "desc" },
      include: {
        course: { select: { id: true, slug: true, title: true, thumbnailUrl: true } },
        history: { orderBy: { createdAt: "desc" } },
      },
    });
  }

  async enrollFree(userId: string, courseId: string) {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, status: "PUBLISHED", deletedAt: null },
      select: { id: true, isFree: true },
    });
    if (!course) throw new NotFoundException("دوره منتشرشده پیدا نشد.");
    if (!course.isFree) {
      throw new BadRequestException(
        "این دوره رایگان نیست؛ دسترسی فقط پس از تأیید پرداخت از سمت سرور فعال می‌شود.",
      );
    }
    return this.activate({
      userId,
      courseId,
      actorId: userId,
      source: EnrollmentSource.FREE,
      expiresAt: null,
      reason: "ثبت‌نام رایگان",
    });
  }

  async createManual(input: ManualEnrollmentDto, actorId: string) {
    const course = await this.prisma.course.findFirst({
      where: { id: input.courseId, status: "PUBLISHED", deletedAt: null },
      select: { id: true },
    });
    if (!course) throw new NotFoundException("دوره منتشرشده پیدا نشد.");
    const user = await this.prisma.user.findFirst({
      where: { id: input.userId, status: "ACTIVE" },
      select: { id: true },
    });
    if (!user) throw new NotFoundException("دانشجوی فعال پیدا نشد.");
    const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
    if (expiresAt && expiresAt <= new Date()) {
      throw new BadRequestException("تاریخ انقضای ثبت‌نام باید در آینده باشد.");
    }
    return this.activate({
      userId: input.userId,
      courseId: input.courseId,
      actorId,
      source: EnrollmentSource.MANUAL,
      expiresAt,
      reason: input.reason ?? "ثبت‌نام دستی توسط مدیر",
    });
  }

  async listAll(page: number, limit: number, courseId?: string) {
    const where = courseId ? { courseId } : {};
    const [data, total] = await this.prisma.$transaction([
      this.prisma.enrollment.findMany({
        where,
        orderBy: { enrolledAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          course: { select: { id: true, slug: true, title: true } },
          history: { orderBy: { createdAt: "desc" } },
        },
      }),
      this.prisma.enrollment.count({ where }),
    ]);
    return { data, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  listStudents() {
    return this.prisma.user.findMany({
      where: {
        status: "ACTIVE",
        roles: { some: { role: { name: "STUDENT" } } },
      },
      select: { id: true, name: true, email: true, phone: true },
      orderBy: { name: "asc" },
      take: 200,
    });
  }

  listPublishedCourses() {
    return this.prisma.course.findMany({
      where: { status: "PUBLISHED", deletedAt: null },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
      take: 200,
    });
  }

  async revoke(id: string, actorId: string, reason?: string) {
    return this.prisma.$transaction(async (transaction) => {
      const current = await transaction.enrollment.findUnique({
        where: { id },
        select: { id: true, status: true, source: true },
      });
      if (!current) throw new NotFoundException("ثبت‌نام پیدا نشد.");
      if (current.status === EnrollmentStatus.REVOKED) {
        throw new ConflictException("این ثبت‌نام قبلاً لغو شده است.");
      }
      const enrollment = await transaction.enrollment.update({
        where: { id },
        data: { status: EnrollmentStatus.REVOKED },
      });
      await transaction.enrollmentHistory.create({
        data: {
          enrollmentId: id,
          actorId,
          status: EnrollmentStatus.REVOKED,
          source: current.source,
          reason: reason ?? "لغو دسترسی توسط مدیر",
        },
      });
      return enrollment;
    });
  }

  private activate(input: {
    userId: string;
    courseId: string;
    actorId: string;
    source: EnrollmentSource;
    expiresAt: Date | null;
    reason: string;
  }) {
    return this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.enrollment.findUnique({
        where: {
          userId_courseId: { userId: input.userId, courseId: input.courseId },
        },
        select: { id: true, status: true, expiresAt: true },
      });
      if (
        existing?.status === EnrollmentStatus.ACTIVE &&
        (!existing.expiresAt || existing.expiresAt > new Date())
      ) {
        throw new ConflictException("این دانشجو دسترسی فعال به دوره دارد.");
      }
      const enrollment = await transaction.enrollment.upsert({
        where: {
          userId_courseId: { userId: input.userId, courseId: input.courseId },
        },
        update: {
          status: EnrollmentStatus.ACTIVE,
          source: input.source,
          enrolledAt: new Date(),
          expiresAt: input.expiresAt,
        },
        create: {
          userId: input.userId,
          courseId: input.courseId,
          status: EnrollmentStatus.ACTIVE,
          source: input.source,
          expiresAt: input.expiresAt,
        },
      });
      await transaction.enrollmentHistory.create({
        data: {
          enrollmentId: enrollment.id,
          actorId: input.actorId,
          status: EnrollmentStatus.ACTIVE,
          source: input.source,
          reason: input.reason,
        },
      });
      return enrollment;
    });
  }
}
