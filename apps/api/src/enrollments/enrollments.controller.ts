import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthRequest } from "../auth/auth.types";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { TrustedOriginGuard } from "../auth/trusted-origin.guard";
import {
  EnrollmentListQueryDto,
  FreeEnrollmentDto,
  ManualEnrollmentDto,
  RevokeEnrollmentDto,
} from "./enrollment.dto";
import { EnrollmentsService } from "./enrollments.service";

@ApiTags("Enrollments")
@ApiCookieAuth("attractory_session")
@UseGuards(SessionAuthGuard, RolesGuard)
@Controller("enrollments")
export class EnrollmentsController {
  constructor(private readonly enrollments: EnrollmentsService) {}

  @Get("me")
  @Roles("STUDENT", "INSTRUCTOR", "SUPER_ADMIN")
  listMine(@CurrentUser() user: AuthRequest["user"]) {
    return this.enrollments.listMine(user!.id);
  }

  @Post()
  @Roles("STUDENT", "INSTRUCTOR", "SUPER_ADMIN")
  @UseGuards(TrustedOriginGuard)
  enrollFree(
    @CurrentUser() user: AuthRequest["user"],
    @Body() input: FreeEnrollmentDto,
  ) {
    return this.enrollments.enrollFree(user!.id, input.courseId);
  }

  @Get()
  @Roles("SUPER_ADMIN")
  listAll(@Query() query: EnrollmentListQueryDto) {
    return this.enrollments.listAll(query.page, query.limit, query.courseId);
  }

  @Get("admin/students")
  @Roles("SUPER_ADMIN")
  @Header("Cache-Control", "private, no-store, max-age=0")
  listStudents() {
    return this.enrollments.listStudents();
  }

  @Get("admin/courses")
  @Roles("SUPER_ADMIN")
  listPublishedCourses() {
    return this.enrollments.listPublishedCourses();
  }

  @Post("manual")
  @Roles("SUPER_ADMIN")
  @UseGuards(TrustedOriginGuard)
  manual(
    @CurrentUser() user: AuthRequest["user"],
    @Body() input: ManualEnrollmentDto,
  ) {
    return this.enrollments.createManual(input, user!.id);
  }

  @Post(":id/revoke")
  @Roles("SUPER_ADMIN")
  @UseGuards(TrustedOriginGuard)
  revoke(
    @CurrentUser() user: AuthRequest["user"],
    @Param("id", ParseUUIDPipe) id: string,
    @Body() input: RevokeEnrollmentDto,
  ) {
    return this.enrollments.revoke(id, user!.id, input.reason);
  }
}
