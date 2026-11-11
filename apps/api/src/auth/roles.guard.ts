import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { REQUIRED_ROLES } from "./roles.decorator";
import { AuthRequest } from "./auth.types";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(REQUIRED_ROLES, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles?.length) return true;

    const user = context.switchToHttp().getRequest<AuthRequest>().user;
    if (!user || !requiredRoles.some((role) => user.roles.includes(role))) {
      throw new ForbiddenException("دسترسی لازم را ندارید.");
    }

    return true;
  }
}
