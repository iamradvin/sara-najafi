import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class FarazSmsService {
  private readonly logger = new Logger(FarazSmsService.name);

  constructor(private readonly config: ConfigService) {}

  async sendOtp(phone: string, code: string): Promise<void> {
    const apiKey = this.config.get<string>("FARAZ_SMS_API_KEY")?.trim();
    const patternCode = this.config.get<string>("FARAZ_SMS_PATTERN")?.trim();
    const lineNumber = this.config.get<string>("FARAZ_SMS_SENDER")?.trim();
    if (!apiKey || !patternCode || !lineNumber || !/^\d+$/.test(lineNumber)) {
      throw new ServiceUnavailableException("تنظیمات پیامک ورود کامل نشده است.");
    }

    let response: Response;
    try {
      response = await fetch("https://api.iranpayamak.com/ws/v1/sms/pattern", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Api-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: patternCode,
          recipient: this.toNationalPhone(phone),
          attributes: { code },
          line_number: lineNumber,
          number_format: "english",
        }),
        signal: AbortSignal.timeout(10_000),
        cache: "no-store",
      });
    } catch {
      throw new ServiceUnavailableException("ارتباط با سرویس پیامک برقرار نشد.");
    }

    if (!response.ok) {
      this.logger.warn(`IranPayamak SMS request rejected with HTTP ${response.status}.`);
      throw new ServiceUnavailableException("ارسال کد انجام نشد؛ تنظیمات پترن یا خط ایران‌پیامک را بررسی کنید.");
    }

    let result: unknown;
    try {
      result = await response.json();
    } catch {
      this.logger.warn(`IranPayamak SMS returned an invalid response with HTTP ${response.status}.`);
      throw new ServiceUnavailableException("پاسخ سرویس پیامک معتبر نیست.");
    }

    if (!result || typeof result !== "object" || !("status" in result) || result.status !== "success") {
      this.logger.warn(`IranPayamak SMS was not accepted with HTTP ${response.status}.`);
      throw new ServiceUnavailableException("ارسال کد انجام نشد؛ تنظیمات پترن یا خط ایران‌پیامک را بررسی کنید.");
    }
  }

  private toNationalPhone(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("98")) return `0${digits.slice(2)}`;
    return digits;
  }
}
