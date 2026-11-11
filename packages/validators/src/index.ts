import { z } from "zod";

export function normalizeDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

const persianPhoneSchema = z
  .string()
  .transform((value) => normalizeDigits(value).trim())
  .pipe(z.string().regex(/^(?:(?:\+|00)?98|0)?9\d{9}$/, "شماره همراه معتبر نیست."));

export const requestSmsOtpSchema = z.object({
  phone: persianPhoneSchema,
  mode: z.enum(["login", "register"]),
  name: z.string().trim().min(2, "نام باید حداقل ۲ نویسه باشد.").max(160).optional(),
});

export const verifySmsOtpSchema = z.object({
  phone: persianPhoneSchema,
  code: z.string().transform(normalizeDigits).pipe(
    z.string().regex(/^\d{6}$/, "کد تأیید باید ۶ رقم باشد."),
  ),
  mode: z.enum(["login", "register"]),
});

export const platformHealthJobSchema = z.object({
  kind: z.literal("health.check"),
  requestedAt: z.string().datetime(),
});

export type RequestSmsOtpInput = z.infer<typeof requestSmsOtpSchema>;
export type VerifySmsOtpInput = z.infer<typeof verifySmsOtpSchema>;
export type PlatformHealthJobInput = z.infer<typeof platformHealthJobSchema>;
