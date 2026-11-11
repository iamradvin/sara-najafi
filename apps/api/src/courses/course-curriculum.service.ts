import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateLessonDto,
  CreateSectionDto,
  UpdateLessonDto,
  UpdateSectionDto,
} from "./course-curriculum.dto";

const curriculumInclude = {
  orderBy: { position: "asc" as const },
  include: {
    lessons: {
      orderBy: { position: "asc" as const },
      include: {
        _count: { select: { progress: true } },
        resources: { orderBy: { position: "asc" as const } },
      },
    },
  },
};

@Injectable()
export class CourseCurriculumService {
  constructor(private readonly prisma: PrismaService) {}

  async list(courseId: string) {
    await this.assertCourseExists(courseId);
    return this.prisma.courseSection.findMany({
      where: { courseId },
      ...curriculumInclude,
    });
  }

  async createSection(courseId: string, input: CreateSectionDto) {
    await this.assertCourseExists(courseId);
    const last = await this.prisma.courseSection.findFirst({
      where: { courseId },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    try {
      return await this.prisma.courseSection.create({
        data: { courseId, title: input.title, position: (last?.position ?? 0) + 1 },
        include: { lessons: true },
      });
    } catch (error) {
      this.throwForPositionConflict(error);
      throw error;
    }
  }

  async updateSection(courseId: string, sectionId: string, input: UpdateSectionDto) {
    await this.assertSectionExists(courseId, sectionId);
    return this.prisma.courseSection.update({
      where: { id: sectionId },
      data: input,
      include: { lessons: { orderBy: { position: "asc" } } },
    });
  }

  async deleteSection(courseId: string, sectionId: string) {
    const deleted = await this.prisma.courseSection.deleteMany({
      where: {
        id: sectionId,
        courseId,
        course: { deletedAt: null },
        lessons: { every: { progress: { none: {} } } },
      },
    });
    if (!deleted.count) {
      await this.assertSectionExists(courseId, sectionId);
      throw new ConflictException("این فصل سابقه یادگیری دارد و برای حفظ سوابق حذف نمی‌شود.");
    }
    return { deleted: true };
  }

  async reorderSections(courseId: string, sectionIds: string[]) {
    await this.assertCourseExists(courseId);
    const existing = await this.prisma.courseSection.findMany({
      where: { courseId },
      orderBy: { position: "asc" },
      select: { id: true },
    });
    this.assertExactOrder(existing.map((section) => section.id), sectionIds, "فصل");
    await this.prisma.$transaction(async (transaction) => {
      for (const [index, sectionId] of sectionIds.entries()) {
        await transaction.courseSection.update({
          where: { id: sectionId },
          data: { position: -(index + 1) },
        });
      }
      for (const [index, sectionId] of sectionIds.entries()) {
        await transaction.courseSection.update({
          where: { id: sectionId },
          data: { position: index + 1 },
        });
      }
    });
    return this.list(courseId);
  }

  async createLesson(courseId: string, sectionId: string, input: CreateLessonDto) {
    await this.assertSectionExists(courseId, sectionId);
    const last = await this.prisma.lesson.findFirst({
      where: { sectionId },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    try {
      return await this.prisma.lesson.create({
        data: {
          sectionId,
          title: input.title,
          description: input.description,
          videoKey: input.videoKey,
          durationSec: input.durationSec ?? 0,
          isPreview: input.isPreview ?? false,
          isPublished: input.isPublished ?? true,
          position: (last?.position ?? 0) + 1,
        },
      });
    } catch (error) {
      this.throwForPositionConflict(error);
      throw error;
    }
  }

  async updateLesson(
    courseId: string,
    sectionId: string,
    lessonId: string,
    input: UpdateLessonDto,
  ) {
    await this.assertLessonExists(courseId, sectionId, lessonId);
    return this.prisma.lesson.update({ where: { id: lessonId }, data: input });
  }

  async deleteLesson(courseId: string, sectionId: string, lessonId: string) {
    const deleted = await this.prisma.lesson.deleteMany({
      where: {
        id: lessonId,
        sectionId,
        section: { courseId, course: { deletedAt: null } },
        progress: { none: {} },
      },
    });
    if (!deleted.count) {
      await this.assertLessonExists(courseId, sectionId, lessonId);
      throw new ConflictException("این جلسه سابقه یادگیری دارد و برای حفظ سوابق حذف نمی‌شود.");
    }
    return { deleted: true };
  }

  async reorderLessons(courseId: string, sectionId: string, lessonIds: string[]) {
    await this.assertSectionExists(courseId, sectionId);
    const existing = await this.prisma.lesson.findMany({
      where: { sectionId },
      orderBy: { position: "asc" },
      select: { id: true },
    });
    this.assertExactOrder(existing.map((lesson) => lesson.id), lessonIds, "جلسه");
    await this.prisma.$transaction(async (transaction) => {
      for (const [index, lessonId] of lessonIds.entries()) {
        await transaction.lesson.update({ where: { id: lessonId }, data: { position: -(index + 1) } });
      }
      for (const [index, lessonId] of lessonIds.entries()) {
        await transaction.lesson.update({ where: { id: lessonId }, data: { position: index + 1 } });
      }
    });
    return this.list(courseId);
  }

  private async assertCourseExists(courseId: string): Promise<void> {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, deletedAt: null },
      select: { id: true },
    });
    if (!course) throw new NotFoundException("دوره پیدا نشد.");
  }

  private async assertSectionExists(courseId: string, sectionId: string): Promise<void> {
    const section = await this.prisma.courseSection.findFirst({
      where: { id: sectionId, courseId, course: { deletedAt: null } },
      select: { id: true },
    });
    if (!section) throw new NotFoundException("فصل دوره پیدا نشد.");
  }

  private async assertLessonExists(courseId: string, sectionId: string, lessonId: string): Promise<void> {
    const lesson = await this.prisma.lesson.findFirst({
      where: {
        id: lessonId,
        sectionId,
        section: { courseId, course: { deletedAt: null } },
      },
      select: { id: true },
    });
    if (!lesson) throw new NotFoundException("جلسه دوره پیدا نشد.");
  }

  private assertExactOrder(current: string[], requested: string[], label: string): void {
    if (
      current.length !== requested.length ||
      current.some((id) => !requested.includes(id))
    ) {
      throw new ConflictException(`فهرست ${label}ها تغییر کرده است؛ فهرست را تازه‌سازی و دوباره تلاش کن.`);
    }
  }

  private throwForPositionConflict(error: unknown): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ConflictException("ترتیب محتوا هم‌زمان تغییر کرده است؛ دوباره تلاش کن.");
    }
  }
}
