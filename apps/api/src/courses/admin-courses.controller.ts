import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { CourseStatus } from "@prisma/client";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthRequest } from "../auth/auth.types";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { TrustedOriginGuard } from "../auth/trusted-origin.guard";
import {
  CourseListQueryDto,
  CreateCourseDto,
  UpdateCourseDto,
} from "./course-admin.dto";
import { CoursesService } from "./courses.service";

@Controller("admin/courses")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles("INSTRUCTOR", "SUPER_ADMIN")
@ApiTags("Course management")
@ApiCookieAuth("attractory_session")
export class AdminCoursesController {
  constructor(private readonly courses: CoursesService) {}

  @Get()
  list(
    @CurrentUser() user: AuthRequest["user"],
    @Query() query: CourseListQueryDto,
  ) {
    return this.courses.listForAdmin(
      user!.id,
      user!.roles.includes("SUPER_ADMIN"),
      query.page,
      query.limit,
    );
  }

  @Post()
  @UseGuards(TrustedOriginGuard)
  create(
    @CurrentUser() user: AuthRequest["user"],
    @Body() input: CreateCourseDto,
  ) {
    return this.courses.createDraft(
      input,
      user!.id,
      user!.roles.includes("SUPER_ADMIN"),
    );
  }

  @Patch(":id")
  @UseGuards(TrustedOriginGuard)
  update(
    @CurrentUser() user: AuthRequest["user"],
    @Param("id", ParseUUIDPipe) id: string,
    @Body() input: UpdateCourseDto,
  ) {
    return this.courses.updateCourse(
      id,
      input,
      user!.id,
      user!.roles.includes("SUPER_ADMIN"),
    );
  }

  @Post(":id/publish")
  @UseGuards(TrustedOriginGuard)
  publish(
    @CurrentUser() user: AuthRequest["user"],
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.courses.setCourseStatus(id, CourseStatus.PUBLISHED, user!.id, user!.roles.includes("SUPER_ADMIN"));
  }

  @Post(":id/review")
  @UseGuards(TrustedOriginGuard)
  review(
    @CurrentUser() user: AuthRequest["user"],
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.courses.setCourseStatus(id, CourseStatus.REVIEW, user!.id, user!.roles.includes("SUPER_ADMIN"));
  }

  @Post(":id/unpublish")
  @UseGuards(TrustedOriginGuard)
  unpublish(
    @CurrentUser() user: AuthRequest["user"],
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.courses.setCourseStatus(id, CourseStatus.DRAFT, user!.id, user!.roles.includes("SUPER_ADMIN"));
  }

  @Post(":id/archive")
  @UseGuards(TrustedOriginGuard)
  archive(
    @CurrentUser() user: AuthRequest["user"],
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.courses.setCourseStatus(id, CourseStatus.ARCHIVED, user!.id, user!.roles.includes("SUPER_ADMIN"));
  }

  @Delete(":id")
  @UseGuards(TrustedOriginGuard)
  delete(
    @CurrentUser() user: AuthRequest["user"],
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.courses.deleteCourse(id, user!.id, user!.roles.includes("SUPER_ADMIN"));
  }
}
