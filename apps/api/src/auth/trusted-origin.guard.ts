import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthRequest } from "./auth.types";
import { getWebOrigins } from "../common/web-origins";

@Injectable()
export class TrustedOriginGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const origin = request.headers.origin;
    const trustedOrigins = getWebOrigins(this.config);

    if (!origin || !trustedOrigins.includes(origin)) {
      throw new ForbiddenException("درخواست از مبدأ مجاز ارسال نشده است.");
    }

    return true;
  }
}
