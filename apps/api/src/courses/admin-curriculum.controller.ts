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
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { TrustedOriginGuard } from "../auth/trusted-origin.guard";
import {
  CreateLessonDto,
  CreateSectionDto,
  ReorderLessonsDto,
  ReorderSectionsDto,
  UpdateLessonDto,
  UpdateSectionDto,
} from "./course-curriculum.dto";
import { CourseCurriculumService } from "./course-curriculum.service";

@Controller("admin/courses/:courseId/curriculum")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles("SUPER_ADMIN")
export class AdminCurriculumController {
  constructor(private readonly curriculum: CourseCurriculumService) {}

  @Get()
  list(@Param("courseId", ParseUUIDPipe) courseId: string) {
    return this.curriculum.list(courseId);
  }

  @Post("sections")
  @UseGuards(TrustedOriginGuard)
  createSection(
    @Param("courseId", ParseUUIDPipe) courseId: string,
    @Body() input: CreateSectionDto,
  ) {
    return this.curriculum.createSection(courseId, input);
  }

  @Patch("sections/:sectionId")
  @UseGuards(TrustedOriginGuard)
  updateSection(
    @Param("courseId", ParseUUIDPipe) courseId: string,
    @Param("sectionId", ParseUUIDPipe) sectionId: string,
    @Body() input: UpdateSectionDto,
  ) {
    return this.curriculum.updateSection(courseId, sectionId, input);
  }

  @Delete("sections/:sectionId")
  @UseGuards(TrustedOriginGuard)
  deleteSection(
    @Param("courseId", ParseUUIDPipe) courseId: string,
    @Param("sectionId", ParseUUIDPipe) sectionId: string,
  ) {
    return this.curriculum.deleteSection(courseId, sectionId);
  }

  @Put("sections/reorder")
  @UseGuards(TrustedOriginGuard)
  reorderSections(
    @Param("courseId", ParseUUIDPipe) courseId: string,
    @Body() input: ReorderSectionsDto,
  ) {
    return this.curriculum.reorderSections(courseId, input.sectionIds);
  }

  @Post("sections/:sectionId/lessons")
  @UseGuards(TrustedOriginGuard)
  createLesson(
    @Param("courseId", ParseUUIDPipe) courseId: string,
    @Param("sectionId", ParseUUIDPipe) sectionId: string,
    @Body() input: CreateLessonDto,
  ) {
    return this.curriculum.createLesson(courseId, sectionId, input);
  }

  @Patch("sections/:sectionId/lessons/:lessonId")
  @UseGuards(TrustedOriginGuard)
  updateLesson(
    @Param("courseId", ParseUUIDPipe) courseId: string,
    @Param("sectionId", ParseUUIDPipe) sectionId: string,
    @Param("lessonId", ParseUUIDPipe) lessonId: string,
    @Body() input: UpdateLessonDto,
  ) {
    return this.curriculum.updateLesson(courseId, sectionId, lessonId, input);
  }

  @Delete("sections/:sectionId/lessons/:lessonId")
  @UseGuards(TrustedOriginGuard)
  deleteLesson(
    @Param("courseId", ParseUUIDPipe) courseId: string,
    @Param("sectionId", ParseUUIDPipe) sectionId: string,
    @Param("lessonId", ParseUUIDPipe) lessonId: string,
  ) {
    return this.curriculum.deleteLesson(courseId, sectionId, lessonId);
  }

  @Put("sections/:sectionId/lessons/reorder")
  @UseGuards(TrustedOriginGuard)
  reorderLessons(
    @Param("courseId", ParseUUIDPipe) courseId: string,
    @Param("sectionId", ParseUUIDPipe) sectionId: string,
    @Body() input: ReorderLessonsDto,
  ) {
    return this.curriculum.reorderLessons(courseId, sectionId, input.lessonIds);
  }
}
