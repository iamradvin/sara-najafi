import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { AuthRequest } from "./auth.types";

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    context.switchToHttp().getRequest<AuthRequest>().user,
);
