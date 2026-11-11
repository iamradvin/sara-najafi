import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthRequest } from "./auth.types";

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const token = this.auth.readSessionCookie(request.headers.cookie);
    if (!token) throw new UnauthorizedException("ورود لازم است.");

    const user = await this.auth.findAuthenticatedUser(token);
    if (!user) throw new UnauthorizedException("نشست معتبر نیست؛ دوباره وارد شوید.");

    request.user = user;
    return true;
  }
}
