import {
  Body,
  Controller,
  Get,
  Header,
  Post,
  Patch,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import { AuthRequest, HeaderResponse } from "./auth.types";
import { SessionAuthGuard } from "./session-auth.guard";
import { TrustedOriginGuard } from "./trusted-origin.guard";
import { CurrentUser } from "./current-user.decorator";
import { Roles } from "./roles.decorator";
import { RolesGuard } from "./roles.guard";
import {
  requestSmsOtpSchema,
  RequestSmsOtpInput,
  verifySmsOtpSchema,
  VerifySmsOtpInput,
} from "@attractory/validators";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { UpdateProfileDto } from "./profile.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("otp/request")
  @UseGuards(TrustedOriginGuard)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  requestSmsOtp(@Body(new ZodValidationPipe(requestSmsOtpSchema)) input: RequestSmsOtpInput) {
    return this.auth.requestSmsOtp(input);
  }

  @Post("otp/verify")
  @UseGuards(TrustedOriginGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  verifySmsOtp(
    @Body(new ZodValidationPipe(verifySmsOtpSchema)) input: VerifySmsOtpInput,
    @Res({ passthrough: true }) response: HeaderResponse,
  ) {
    return this.auth.verifySmsOtp(input, response);
  }

  @Post("logout")
  @UseGuards(TrustedOriginGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  logout(
    @Req() request: AuthRequest,
    @Res({ passthrough: true }) response: HeaderResponse,
  ) {
    return this.auth.logout(request.headers.cookie, response);
  }

  @Get("me")
  @UseGuards(SessionAuthGuard)
  currentUser(@CurrentUser() user: AuthRequest["user"]) {
    return user;
  }

  @Get("profile")
  @UseGuards(SessionAuthGuard)
  @Header("Cache-Control", "private, no-store, max-age=0")
  profile(@CurrentUser() user: AuthRequest["user"]) {
    return this.auth.getProfile(user!.id);
  }

  @Patch("profile")
  @UseGuards(SessionAuthGuard, TrustedOriginGuard)
  updateProfile(
    @CurrentUser() user: AuthRequest["user"],
    @Body() input: UpdateProfileDto,
  ) {
    return this.auth.updateProfile(user!.id, input);
  }

  @Get("student-check")
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles("STUDENT", "SUPER_ADMIN")
  studentCheck(@CurrentUser() user: AuthRequest["user"]) {
    return user;
  }

  @Get("admin-check")
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles("INSTRUCTOR", "SUPER_ADMIN")
  adminCheck(@CurrentUser() user: AuthRequest["user"]) {
    return user;
  }
}
