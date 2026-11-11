import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { RolesGuard } from "./roles.guard";
import { SessionAuthGuard } from "./session-auth.guard";
import { TrustedOriginGuard } from "./trusted-origin.guard";
import { FarazSmsService } from "./faraz-sms.service";

@Module({
  controllers: [AuthController],
  providers: [AuthService, FarazSmsService, SessionAuthGuard, RolesGuard, TrustedOriginGuard],
  exports: [AuthService, SessionAuthGuard, RolesGuard, TrustedOriginGuard],
})
export class AuthModule {}
