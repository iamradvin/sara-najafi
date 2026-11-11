import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma, UserStatus } from "@prisma/client";
import type {
  RequestSmsOtpInput,
  VerifySmsOtpInput,
} from "@attractory/validators";
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { AuthenticatedUser, HeaderResponse } from "./auth.types";
import { FarazSmsService } from "./faraz-sms.service";
import { UpdateProfileDto } from "./profile.dto";

const SESSION_COOKIE = "attractory_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_RESEND_DELAY_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

type UserWithRoles = Prisma.UserGetPayload<{
  include: { roles: { include: { role: true } } };
}>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly farazSms: FarazSmsService,
  ) {}

  async requestSmsOtp(input: RequestSmsOtpInput): Promise<{ success: true }> {
    const phone = this.normalizePhone(input.phone);
    const existing = await this.prisma.user.findUnique({
      where: { phone },
      select: { id: true },
    });

    if (input.mode === "register" && existing) {
      throw new ConflictException("این شماره قبلاً ثبت شده است؛ از ورود پیامکی استفاده کن.");
    }

    if (input.mode === "login" && !existing) {
      throw new ConflictException("این شماره ثبت‌نام نشده است؛ ابتدا ثبت‌نام کن.");
    }

    if (input.mode === "register" && !input.name?.trim()) {
      throw new ConflictException("نام و نام خانوادگی الزامی است.");
    }

    const previous = await this.prisma.smsOtpChallenge.findUnique({ where: { phone } });
    if (previous && Date.now() - previous.createdAt.getTime() < OTP_RESEND_DELAY_MS) {
      throw new HttpException("برای ارسال دوباره کد کمی صبر کن.", HttpStatus.TOO_MANY_REQUESTS);
    }

    const secret = this.config.get<string>("AUTH_OTP_SECRET")?.trim();
    if (!secret || secret.length < 32) {
      throw new ServiceUnavailableException("تنظیم امن کد یک‌بارمصرف کامل نشده است.");
    }

    const fixedCode = input.mode === "login" ? this.getStagingFixedOtp(phone) : null;
    const code = fixedCode ?? randomInt(100_000, 1_000_000).toString();
    const now = new Date();
    await this.prisma.smsOtpChallenge.upsert({
      where: { phone },
      update: {
        codeHash: this.hashOtp(phone, code, secret),
        purpose: this.getOtpPurpose(input.mode),
        name: input.mode === "register" ? input.name?.trim() ?? null : null,
        attempts: 0,
        createdAt: now,
        expiresAt: new Date(now.getTime() + OTP_TTL_MS),
        consumedAt: null,
      },
      create: {
        phone,
        codeHash: this.hashOtp(phone, code, secret),
        purpose: this.getOtpPurpose(input.mode),
        name: input.mode === "register" ? input.name?.trim() ?? null : null,
        expiresAt: new Date(now.getTime() + OTP_TTL_MS),
      },
    });

    if (!fixedCode) {
      try {
        await this.farazSms.sendOtp(phone, code);
      } catch (error) {
        await this.prisma.smsOtpChallenge.deleteMany({ where: { phone, createdAt: now } });
        throw error;
      }
    }

    return { success: true };
  }

  async verifySmsOtp(
    input: VerifySmsOtpInput,
    response: HeaderResponse,
  ): Promise<AuthenticatedUser> {
    const phone = this.normalizePhone(input.phone);
    const challenge = await this.prisma.smsOtpChallenge.findUnique({ where: { phone } });
    if (
      !challenge ||
      challenge.purpose !== this.getOtpPurpose(input.mode) ||
      challenge.expiresAt <= new Date() ||
      challenge.consumedAt ||
      (input.mode === "register" && !challenge.name)
    ) {
      throw new UnauthorizedException("کد معتبر نیست یا منقضی شده است.");
    }
    if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
      throw new HttpException(
        "تعداد تلاش‌ها بیش از حد مجاز است؛ کد تازه بگیر.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const secret = this.config.get<string>("AUTH_OTP_SECRET")?.trim();
    if (!secret || secret.length < 32) {
      throw new ServiceUnavailableException("تنظیم امن کد یک‌بارمصرف کامل نشده است.");
    }
    const expected = Buffer.from(challenge.codeHash, "hex");
    const received = Buffer.from(this.hashOtp(phone, input.code, secret), "hex");
    if (!timingSafeEqual(expected, received)) {
      const result = await this.prisma.smsOtpChallenge.updateMany({
        where: { id: challenge.id, attempts: { lt: OTP_MAX_ATTEMPTS }, consumedAt: null },
        data: { attempts: { increment: 1 } },
      });
      if (!result.count) {
        throw new HttpException(
          "تعداد تلاش‌ها بیش از حد مجاز است؛ کد تازه بگیر.",
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      throw new UnauthorizedException("کد معتبر نیست یا منقضی شده است.");
    }

    const user: UserWithRoles = await this.prisma.$transaction(async (transaction): Promise<UserWithRoles> => {
      const consumed = await transaction.smsOtpChallenge.updateMany({
        where: {
          id: challenge.id,
          purpose: this.getOtpPurpose(input.mode),
          attempts: { lt: OTP_MAX_ATTEMPTS },
          expiresAt: { gt: new Date() },
          consumedAt: null,
        },
        data: { consumedAt: new Date() },
      });
      if (!consumed.count) {
        throw new UnauthorizedException("کد معتبر نیست یا منقضی شده است.");
      }

      if (input.mode === "register") {
        const name = challenge.name;
        if (!name) {
          throw new UnauthorizedException("کد معتبر نیست یا منقضی شده است.");
        }
        const role = await transaction.role.upsert({
          where: { name: "STUDENT" },
          update: {},
          create: { name: "STUDENT", description: "دانشجوی سامانه" },
        });
        const created = await transaction.user.create({
          data: {
            phone,
            name,
            roles: { create: { roleId: role.id } },
          },
          include: { roles: { include: { role: true } } },
        });
        return created;
      }

      const existing = await transaction.user.findUnique({
        where: { phone },
        include: { roles: { include: { role: true } } },
      });
      if (!existing || existing.status !== UserStatus.ACTIVE || existing.deletedAt) {
        throw new UnauthorizedException("شماره یا کد تأییدشده نیست.");
      }
      return existing;
    });

    await this.startSession(user.id, response);
    return this.toAuthenticatedUser(user);
  }

  async logout(cookieHeader: string | undefined, response: HeaderResponse): Promise<{ success: true }> {
    const token = this.readSessionCookie(cookieHeader);
    if (token) {
      await this.prisma.session.updateMany({
        where: { tokenHash: this.hashToken(token), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    response.setHeader("Set-Cookie", this.clearSessionCookie());
    return { success: true };
  }

  getProfile(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
      },
    });
  }

  async updateProfile(userId: string, input: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        name: input.name,
        ...(input.bio !== undefined ? { bio: input.bio || null } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
      },
    });
  }

  async findAuthenticatedUser(token: string): Promise<AuthenticatedUser | null> {
    const now = new Date();
    const session = await this.prisma.session.findFirst({
      where: {
        tokenHash: this.hashToken(token),
        expiresAt: { gt: now },
        revokedAt: null,
        user: { status: UserStatus.ACTIVE, deletedAt: null },
      },
      include: { user: { include: { roles: { include: { role: true } } } } },
    });

    if (!session) return null;

    await this.prisma.session.update({
      where: { id: session.id },
      data: { lastUsedAt: now },
    });
    return this.toAuthenticatedUser(session.user);
  }

  readSessionCookie(cookieHeader: string | undefined): string | null {
    if (!cookieHeader) return null;
    const cookie = cookieHeader.split(";").map((part) => part.trim())
      .find((part) => part.startsWith(`${SESSION_COOKIE}=`));
    if (!cookie) return null;

    const token = cookie.slice(SESSION_COOKIE.length + 1);
    return /^[a-f0-9]{64}$/.test(token) ? token : null;
  }

  private async startSession(userId: string, response: HeaderResponse): Promise<void> {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await this.prisma.session.create({
      data: { userId, tokenHash: this.hashToken(token), expiresAt },
    });
    response.setHeader("Set-Cookie", this.sessionCookie(token, expiresAt));
  }

  private sessionCookie(token: string, expiresAt: Date): string {
    const secure = this.config.get<string>("NODE_ENV") === "production" ? "; Secure" : "";
    return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_MS / 1000}; Expires=${expiresAt.toUTCString()}${secure}`;
  }

  private clearSessionCookie(): string {
    const secure = this.config.get<string>("NODE_ENV") === "production" ? "; Secure" : "";
    return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${secure}`;
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private hashOtp(phone: string, code: string, secret: string): string {
    return createHmac("sha256", secret).update(`${phone}:${code}`).digest("hex");
  }

  private getStagingFixedOtp(phone: string): string | null {
    if (
      this.config.get<string>("APP_ENV") !== "staging" ||
      this.config.get<string>("STAGING_FIXED_OTP_ENABLED") !== "true"
    ) {
      return null;
    }

    const configuredPhone = this.config.get<string>("STAGING_FIXED_OTP_PHONE")?.trim();
    const configuredCode = this.config.get<string>("STAGING_FIXED_OTP_CODE")?.trim();
    if (!configuredPhone || !configuredCode || phone !== this.normalizePhone(configuredPhone)) {
      return null;
    }
    return configuredCode;
  }

  private getOtpPurpose(mode: "login" | "register"): "LOGIN" | "REGISTER" {
    return mode === "login" ? "LOGIN" : "REGISTER";
  }

  private normalizePhone(value: string): string {
    let digits = value.replace(/\D/g, "");
    if (digits.startsWith("00")) digits = digits.slice(2);
    if (digits.startsWith("0")) digits = `98${digits.slice(1)}`;
    if (!digits.startsWith("98")) digits = `98${digits}`;
    return `+${digits}`;
  }

  private toAuthenticatedUser(user: UserWithRoles): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles.map(({ role }) => role.name),
    };
  }
}
