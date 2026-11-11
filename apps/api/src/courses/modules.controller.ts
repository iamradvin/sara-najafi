import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
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
  CreateLessonDto,
  CreateLessonResourceDto,
  CreateSectionDto,
  ReorderLessonsDto,
  ReorderSectionsDto,
  UpdateLessonDto,
  UpdateSectionDto,
} from "./course-curriculum.dto";
import { CourseCurriculumService } from "./course-curriculum.service";
import { CoursesService } from "./courses.service";
import { LessonResourcesService } from "./lesson-resources.service";

@ApiTags("Modules and lessons")
@ApiCookieAuth("attractory_session")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles("INSTRUCTOR", "SUPER_ADMIN")
@Controller("modules")
export class ModulesController {
  constructor(
    private readonly courses: CoursesService,
    private readonly curriculum: CourseCurriculumService,
    private readonly resources: LessonResourcesService,
  ) {}

  @Get("course/:courseId")
  list(
    @CurrentUser() user: AuthRequest["user"],
    @Param("courseId", ParseUUIDPipe) courseId: string,
  ) {
    return this.withCourse(user!, courseId, () => this.curriculum.list(courseId));
  }

  @Post("course/:courseId")
  @UseGuards(TrustedOriginGuard)
  create(
    @CurrentUser() user: AuthRequest["user"],
    @Param("courseId", ParseUUIDPipe) courseId: string,
    @Body() input: CreateSectionDto,
  ) {
    return this.withCourse(user!, courseId, () => this.curriculum.createSection(courseId, input));
  }

  @Put("course/:courseId/reorder")
  @UseGuards(TrustedOriginGuard)
  reorder(
    @CurrentUser() user: AuthRequest["user"],
    @Param("courseId", ParseUUIDPipe) courseId: string,
    @Body() input: ReorderSectionsDto,
  ) {
    return this.withCourse(user!, courseId, () => this.curriculum.reorderSections(courseId, input.sectionIds));
  }

  @Patch("course/:courseId/:moduleId")
  @UseGuards(TrustedOriginGuard)
  update(
    @CurrentUser() user: AuthRequest["user"],
    @Param("courseId", ParseUUIDPipe) courseId: string,
    @Param("moduleId", ParseUUIDPipe) moduleId: string,
    @Body() input: UpdateSectionDto,
  ) {
    return this.withCourse(user!, courseId, () => this.curriculum.updateSection(courseId, moduleId, input));
  }

  @Delete("course/:courseId/:moduleId")
  @UseGuards(TrustedOriginGuard)
  delete(
    @CurrentUser() user: AuthRequest["user"],
    @Param("courseId", ParseUUIDPipe) courseId: string,
    @Param("moduleId", ParseUUIDPipe) moduleId: string,
  ) {
    return this.withCourse(user!, courseId, () => this.curriculum.deleteSection(courseId, moduleId));
  }

  @Post("course/:courseId/:moduleId/lessons")
  @UseGuards(TrustedOriginGuard)
  createLesson(
    @CurrentUser() user: AuthRequest["user"],
    @Param("courseId", ParseUUIDPipe) courseId: string,
    @Param("moduleId", ParseUUIDPipe) moduleId: string,
    @Body() input: CreateLessonDto,
  ) {
    return this.withCourse(user!, courseId, () => this.curriculum.createLesson(courseId, moduleId, input));
  }

  @Put("course/:courseId/:moduleId/lessons/reorder")
  @UseGuards(TrustedOriginGuard)
  reorderLessons(
    @CurrentUser() user: AuthRequest["user"],
    @Param("courseId", ParseUUIDPipe) courseId: string,
    @Param("moduleId", ParseUUIDPipe) moduleId: string,
    @Body() input: ReorderLessonsDto,
  ) {
    return this.withCourse(user!, courseId, () => this.curriculum.reorderLessons(courseId, moduleId, input.lessonIds));
  }

  @Patch("course/:courseId/:moduleId/lessons/:lessonId")
  @UseGuards(TrustedOriginGuard)
  updateLesson(
    @CurrentUser() user: AuthRequest["user"],
    @Param("courseId", ParseUUIDPipe) courseId: string,
    @Param("moduleId", ParseUUIDPipe) moduleId: string,
    @Param("lessonId", ParseUUIDPipe) lessonId: string,
    @Body() input: UpdateLessonDto,
  ) {
    return this.withCourse(user!, courseId, () => this.curriculum.updateLesson(courseId, moduleId, lessonId, input));
  }

  @Delete("course/:courseId/:moduleId/lessons/:lessonId")
  @UseGuards(TrustedOriginGuard)
  deleteLesson(
    @CurrentUser() user: AuthRequest["user"],
    @Param("courseId", ParseUUIDPipe) courseId: string,
    @Param("moduleId", ParseUUIDPipe) moduleId: string,
    @Param("lessonId", ParseUUIDPipe) lessonId: string,
  ) {
    return this.withCourse(user!, courseId, () => this.curriculum.deleteLesson(courseId, moduleId, lessonId));
  }

  @Post("course/:courseId/:moduleId/lessons/:lessonId/resources")
  @UseGuards(TrustedOriginGuard)
  createResource(
    @CurrentUser() user: AuthRequest["user"],
    @Param("courseId", ParseUUIDPipe) courseId: string,
    @Param("moduleId", ParseUUIDPipe) moduleId: string,
    @Param("lessonId", ParseUUIDPipe) lessonId: string,
    @Body() input: CreateLessonResourceDto,
  ) {
    return this.withCourse(user!, courseId, async () => {
      await this.curriculum.updateLesson(courseId, moduleId, lessonId, {});
      return this.resources.create(lessonId, input);
    });
  }

  @Delete("course/:courseId/:moduleId/lessons/:lessonId/resources/:resourceId")
  @UseGuards(TrustedOriginGuard)
  deleteResource(
    @CurrentUser() user: AuthRequest["user"],
    @Param("courseId", ParseUUIDPipe) courseId: string,
    @Param("moduleId", ParseUUIDPipe) moduleId: string,
    @Param("lessonId", ParseUUIDPipe) lessonId: string,
    @Param("resourceId", ParseUUIDPipe) resourceId: string,
  ) {
    return this.withCourse(user!, courseId, async () => {
      await this.curriculum.updateLesson(courseId, moduleId, lessonId, {});
      return this.resources.delete(lessonId, resourceId);
    });
  }

  private async withCourse<T>(
    user: NonNullable<AuthRequest["user"]>,
    courseId: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    await this.courses.assertCourseAccess(
      courseId,
      user.id,
      user.roles.includes("SUPER_ADMIN"),
    );
    return operation();
  }
}

@ApiTags("Lessons")
@ApiCookieAuth("attractory_session")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles("INSTRUCTOR", "SUPER_ADMIN")
@Controller("lessons")
export class LessonsController {
  constructor(
    private readonly courses: CoursesService,
    private readonly curriculum: CourseCurriculumService,
    private readonly resources: LessonResourcesService,
  ) {}

  @Get("course/:courseId/module/:moduleId")
  list(
    @CurrentUser() user: AuthRequest["user"],
    @Param("courseId", ParseUUIDPipe) courseId: string,
    @Param("moduleId", ParseUUIDPipe) moduleId: string,
  ) {
    return this.withCourse(user!, courseId, async () => {
      const modules = await this.curriculum.list(courseId);
      return modules.find((module) => module.id === moduleId)?.lessons ?? [];
    });
  }

  @Post("course/:courseId/module/:moduleId")
  @UseGuards(TrustedOriginGuard)
  create(
    @CurrentUser() user: AuthRequest["user"],
    @Param("courseId", ParseUUIDPipe) courseId: string,
    @Param("moduleId", ParseUUIDPipe) moduleId: string,
    @Body() input: CreateLessonDto,
  ) {
    return this.withCourse(user!, courseId, () => this.curriculum.createLesson(courseId, moduleId, input));
  }

  private async withCourse<T>(
    user: NonNullable<AuthRequest["user"]>,
    courseId: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    await this.courses.assertCourseAccess(courseId, user.id, user.roles.includes("SUPER_ADMIN"));
    return operation();
  }
}
