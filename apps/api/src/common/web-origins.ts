import { ConfigService } from "@nestjs/config";

export function getWebOrigins(config: ConfigService): string[] {
  const origins = config
    .get<string>("WEB_ORIGIN", "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => new URL(origin).origin);

  if (!origins.length) throw new Error("WEB_ORIGIN must contain at least one valid origin.");
  return origins;
}
