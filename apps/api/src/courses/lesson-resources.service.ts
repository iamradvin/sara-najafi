import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateLessonResourceDto } from "./course-curriculum.dto";

@Injectable()
export class LessonResourcesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true },
    });
    if (!lesson) throw new NotFoundException("جلسه پیدا نشد.");
    return this.prisma.lessonResource.findMany({
      where: { lessonId },
      orderBy: { position: "asc" },
    });
  }

  async create(lessonId: string, input: CreateLessonResourceDto) {
    const last = await this.prisma.lessonResource.findFirst({
      where: { lessonId },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    try {
      return await this.prisma.lessonResource.create({
        data: {
          ...input,
          lessonId,
          position: (last?.position ?? 0) + 1,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("منابع این جلسه هم‌زمان تغییر کرده‌اند؛ دوباره تلاش کن.");
      }
      throw error;
    }
  }

  async delete(lessonId: string, resourceId: string) {
    const deleted = await this.prisma.lessonResource.deleteMany({
      where: { id: resourceId, lessonId },
    });
    if (!deleted.count) throw new NotFoundException("منبع جلسه پیدا نشد.");
    return { deleted: true };
  }
}
