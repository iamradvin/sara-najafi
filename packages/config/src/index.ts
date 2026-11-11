import { z } from "zod";

const apiEnvironmentSchema = z.object({
  APP_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required."),
  REDIS_ENABLED: z.enum(["true", "false"]).default("true").transform((value) => value === "true"),
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  WEB_ORIGIN: z.string().default("http://localhost:3000"),
  COURSE_UPLOAD_DIR: z.string().default("./uploads"),
  STAGING_FIXED_OTP_ENABLED: z.enum(["true", "false"]).default("false"),
  STAGING_FIXED_OTP_PHONE: z.string().trim().optional(),
  STAGING_FIXED_OTP_CODE: z.string().trim().optional(),
}).passthrough().superRefine((environment, context) => {
  if (environment.STAGING_FIXED_OTP_ENABLED !== "true") return;

  if (environment.APP_ENV !== "staging") {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["STAGING_FIXED_OTP_ENABLED"],
      message: "Fixed OTP login can only be enabled in staging.",
    });
  }
  if (!environment.STAGING_FIXED_OTP_PHONE || !/^09\d{9}$/.test(environment.STAGING_FIXED_OTP_PHONE)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["STAGING_FIXED_OTP_PHONE"],
      message: "A valid staging phone number is required when fixed OTP login is enabled.",
    });
  }
  if (!environment.STAGING_FIXED_OTP_CODE || !/^\d{6}$/.test(environment.STAGING_FIXED_OTP_CODE)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["STAGING_FIXED_OTP_CODE"],
      message: "A six-digit staging OTP is required when fixed OTP login is enabled.",
    });
  }
});

const webEnvironmentSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
}).passthrough();

const workerEnvironmentSchema = z.object({
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  WORKER_HEALTH_PORT: z.coerce.number().int().min(1).max(65535).default(4001),
}).passthrough();

export function validateApiEnvironment(environment: Record<string, unknown>) {
  return apiEnvironmentSchema.parse(environment);
}

export function validateWebEnvironment(environment: Record<string, unknown>) {
  return webEnvironmentSchema.parse(environment);
}

export function validateWorkerEnvironment(environment: Record<string, unknown>) {
  return workerEnvironmentSchema.parse(environment);
}

export type ApiEnvironment = z.infer<typeof apiEnvironmentSchema>;
