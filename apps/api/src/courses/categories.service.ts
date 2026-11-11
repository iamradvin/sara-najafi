import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CategoryInputDto, CategoryPatchDto } from "./category.dto";

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.category.findMany({
      where: { courses: { some: { course: { status: "PUBLISHED", deletedAt: null } } } },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        _count: { select: { courses: true } },
      },
    });
  }

  listForAdmin() {
    return this.prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { courses: true } } },
    });
  }

  async create(input: CategoryInputDto) {
    try {
      return await this.prisma.category.create({ data: input });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("این نشانی دسته‌بندی قبلاً استفاده شده است.");
      }
      throw error;
    }
  }

  async update(id: string, input: CategoryPatchDto) {
    const result = await this.prisma.category.updateMany({ where: { id }, data: input });
    if (!result.count) throw new NotFoundException("دسته‌بندی پیدا نشد.");
    return this.prisma.category.findUniqueOrThrow({ where: { id } });
  }

  async delete(id: string) {
    try {
      await this.prisma.category.delete({ where: { id } });
      return { deleted: true };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") throw new NotFoundException("دسته‌بندی پیدا نشد.");
        if (error.code === "P2003") {
          throw new ConflictException("دسته‌بندی به دوره‌ها متصل است و قابل حذف نیست.");
        }
      }
      throw error;
    }
  }
}
