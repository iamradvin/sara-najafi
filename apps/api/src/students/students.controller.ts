import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthRequest } from "../auth/auth.types";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { UpdateLessonProgressDto } from "./lesson-progress.dto";
import { StudentsService } from "./students.service";

@Controller("student")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles("STUDENT", "SUPER_ADMIN")
export class StudentsController {
  constructor(private readonly students: StudentsService) {}

  @Get("courses")
  listCourses(@CurrentUser() user: AuthRequest["user"]) {
    return this.students.listCourses(user!.id);
  }

  @Get("courses/:courseId/learning")
  @Header("Cache-Control", "private, no-store, max-age=0")
  courseLearning(
    @CurrentUser() user: AuthRequest["user"],
    @Param("courseId", ParseUUIDPipe) courseId: string,
  ) {
    return this.students.getCourseLearning(user!.id, courseId);
  }

  @Get("orders")
  listOrders(@CurrentUser() user: AuthRequest["user"]) {
    return this.students.listOrders(user!.id);
  }

  @Get("lessons/:lessonId/playback")
  @Header("Cache-Control", "private, no-store, max-age=0")
  @Header("Pragma", "no-cache")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  lessonPlayback(
    @CurrentUser() user: AuthRequest["user"],
    @Param("lessonId", ParseUUIDPipe) lessonId: string,
  ) {
    return this.students.getLessonPlayback(user!.id, lessonId);
  }

  @Patch("lessons/:lessonId/progress")
  @Header("Cache-Control", "private, no-store, max-age=0")
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  updateLessonProgress(
    @CurrentUser() user: AuthRequest["user"],
    @Param("lessonId", ParseUUIDPipe) lessonId: string,
    @Body() input: UpdateLessonProgressDto,
  ) {
    return this.students.updateLessonProgress(user!.id, lessonId, input);
  }
}
