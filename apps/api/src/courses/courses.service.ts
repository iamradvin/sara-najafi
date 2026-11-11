import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CourseLevel, CourseStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  CourseCategoryDto,
  CreateCourseDto,
  UpdateCourseDto,
} from "./course-admin.dto";

const adminCourseInclude = {
  categories: { select: { category: { select: { id: true, name: true, slug: true } } } },
  instructor: { select: { id: true, name: true, avatarUrl: true } },
  _count: { select: { sections: true, enrollments: true } },
} satisfies Prisma.CourseInclude;

export type CourseListQuery = {
  page?: number;
  limit?: number;
  category?: string;
  level?: CourseLevel;
  search?: string;
  sort?: "newest" | "popular" | "price_asc" | "price_desc";
};

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async listForAdmin(userId: string, isAdmin: boolean, page = 1, limit = 20) {
    const where: Prisma.CourseWhereInput = {
      deletedAt: null,
      ...(isAdmin ? {} : { instructorId: userId }),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        where,
        orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
        include: adminCourseInclude,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.course.count({ where }),
    ]);
    return { data, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async createDraft(input: CreateCourseDto, userId: string, isAdmin: boolean) {
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const instructorId = isAdmin ? input.instructorId ?? null : userId;
        if (instructorId) await this.assertInstructor(transaction, instructorId);
        const category = await this.upsertCategory(transaction, input.category);
        const categoryIds = new Set(input.categoryIds ?? []);
        if (category) categoryIds.add(category.id);
        await this.assertCategories(transaction, [...categoryIds]);
        return transaction.course.create({
          data: {
            slug: input.slug,
            title: input.title,
            description: input.description,
            thumbnailUrl: input.thumbnailUrl,
            level: input.level,
            priceToman: input.priceToman,
            isFree: input.isFree,
            estimatedMinutes: input.estimatedMinutes,
            currency: input.currency,
            language: input.language,
            instructorId,
            categories: categoryIds.size
              ? { create: [...categoryIds].map((categoryId) => ({ categoryId })) }
              : undefined,
          },
          include: adminCourseInclude,
        });
      });
    } catch (error) {
      this.throwForUniqueConstraint(error);
      throw error;
    }
  }

  async updateCourse(
    id: string,
    input: UpdateCourseDto,
    userId: string,
    isAdmin: boolean,
  ) {
    await this.assertCourseAccess(id, userId, isAdmin);
    const { category, categoryIds: requestedCategoryIds, instructorId, ...courseData } = input;
    if (instructorId !== undefined && !isAdmin) {
      throw new ForbiddenException("تنها مدیر می‌تواند مدرس دوره را تغییر دهد.");
    }
    try {
      return await this.prisma.$transaction(async (transaction) => {
        if (instructorId) await this.assertInstructor(transaction, instructorId);
        if (Object.hasOwn(input, "category") || Object.hasOwn(input, "categoryIds")) {
          await transaction.courseCategory.deleteMany({ where: { courseId: id } });
          const nextCategory = await this.upsertCategory(transaction, category);
          const categoryIds = new Set(requestedCategoryIds ?? []);
          if (nextCategory) categoryIds.add(nextCategory.id);
          await this.assertCategories(transaction, [...categoryIds]);
          if (categoryIds.size) {
            await transaction.courseCategory.createMany({
              data: [...categoryIds].map((categoryId) => ({ courseId: id, categoryId })),
            });
          }
        }

        return transaction.course.update({
          where: { id },
          data: {
            ...courseData,
            ...(instructorId !== undefined ? { instructorId } : {}),
          },
          include: adminCourseInclude,
        });
      });
    } catch (error) {
      this.throwForUniqueConstraint(error);
      throw error;
    }
  }

  async setCourseStatus(
    id: string,
    status: CourseStatus,
    userId: string,
    isAdmin: boolean,
  ) {
    await this.assertCourseAccess(id, userId, isAdmin);
    if (status === CourseStatus.PUBLISHED && !isAdmin) {
      throw new ForbiddenException("انتشار عمومی دوره پس از بازبینی مدیر انجام می‌شود.");
    }
    if (status === CourseStatus.PUBLISHED) {
      const lessonCount = await this.prisma.lesson.count({
        where: { section: { courseId: id }, isPublished: true },
      });
      if (!lessonCount) {
        throw new BadRequestException("برای انتشار، دوره باید دست‌کم یک جلسه منتشرشده داشته باشد.");
      }
    }

    return this.prisma.course.update({
      where: { id },
      data: {
        status,
        publishedAt: status === CourseStatus.PUBLISHED ? new Date() : null,
      },
      include: adminCourseInclude,
    });
  }

  async deleteCourse(id: string, userId: string, isAdmin: boolean) {
    await this.assertCourseAccess(id, userId, isAdmin);
    const course = await this.prisma.course.findUniqueOrThrow({
      where: { id },
      select: { _count: { select: { enrollments: true, orderItems: true } } },
    });
    if (course._count.enrollments || course._count.orderItems) {
      throw new ConflictException(
        "دوره دارای سابقه ثبت‌نام یا سفارش است؛ به‌جای حذف آن را آرشیو کنید.",
      );
    }
    await this.prisma.course.update({
      where: { id },
      data: { deletedAt: new Date(), status: CourseStatus.ARCHIVED, publishedAt: null },
    });
    return { deleted: true };
  }

  async listPublished(query: CourseListQuery = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const where: Prisma.CourseWhereInput = {
      status: CourseStatus.PUBLISHED,
      deletedAt: null,
      ...(query.category
        ? { categories: { some: { category: { slug: query.category } } } }
        : {}),
      ...(query.level ? { level: query.level } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: "insensitive" } },
              { description: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const orderBy: Prisma.CourseOrderByWithRelationInput[] =
      query.sort === "price_asc"
        ? [{ priceToman: "asc" }, { title: "asc" }]
        : query.sort === "price_desc"
          ? [{ priceToman: "desc" }, { title: "asc" }]
          : query.sort === "popular"
            ? [{ enrollments: { _count: "desc" } }, { publishedAt: "desc" }]
            : [{ publishedAt: "desc" }, { title: "asc" }];
    const [data, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          thumbnailUrl: true,
          level: true,
          priceToman: true,
          currency: true,
          language: true,
          isFree: true,
          estimatedMinutes: true,
          categories: { select: { category: { select: { id: true, name: true, slug: true } } } },
          instructor: { select: { id: true, name: true, avatarUrl: true } },
          _count: { select: { sections: true, enrollments: true } },
        },
      }),
      this.prisma.course.count({ where }),
    ]);
    return { data, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  findPublishedBySlug(slug: string) {
    return this.prisma.course.findFirst({
      where: { slug, status: CourseStatus.PUBLISHED, deletedAt: null },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        thumbnailUrl: true,
        level: true,
        priceToman: true,
        currency: true,
        language: true,
        isFree: true,
        estimatedMinutes: true,
        categories: { select: { category: { select: { id: true, name: true, slug: true } } } },
        instructor: { select: { id: true, name: true, bio: true, avatarUrl: true } },
        sections: {
          orderBy: { position: "asc" },
          select: {
            id: true,
            title: true,
            position: true,
            lessons: {
              where: { isPublished: true },
              orderBy: { position: "asc" },
              select: {
                id: true,
                title: true,
                description: true,
                durationSec: true,
                isPreview: true,
                position: true,
              },
            },
          },
        },
      },
    });
  }

  async getInstructor(id: string) {
    const instructor = await this.prisma.user.findFirst({
      where: {
        id,
        status: "ACTIVE",
        roles: { some: { role: { name: "INSTRUCTOR" } } },
      },
      select: {
        id: true,
        name: true,
        bio: true,
        avatarUrl: true,
        instructorCourses: {
          where: { status: CourseStatus.PUBLISHED, deletedAt: null },
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            thumbnailUrl: true,
            level: true,
            priceToman: true,
            currency: true,
            language: true,
            isFree: true,
            estimatedMinutes: true,
            categories: { select: { category: { select: { id: true, name: true, slug: true } } } },
            instructor: { select: { id: true, name: true, avatarUrl: true } },
            _count: { select: { sections: true, enrollments: true } },
          },
          orderBy: { publishedAt: "desc" },
        },
      },
    });
    if (!instructor) throw new NotFoundException("مدرس پیدا نشد.");
    return instructor;
  }

  async assertCourseAccess(id: string, userId: string, isAdmin: boolean): Promise<void> {
    const course = await this.prisma.course.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, instructorId: true },
    });
    if (!course) throw new NotFoundException("دوره پیدا نشد.");
    if (!isAdmin && course.instructorId !== userId) {
      throw new ForbiddenException("تنها مدرس دوره یا مدیر می‌تواند آن را مدیریت کند.");
    }
  }

  private async assertInstructor(
    transaction: Prisma.TransactionClient,
    instructorId: string,
  ) {
    const user = await transaction.user.findFirst({
      where: {
        id: instructorId,
        status: "ACTIVE",
        roles: { some: { role: { name: "INSTRUCTOR" } } },
      },
      select: { id: true },
    });
    if (!user) throw new BadRequestException("کاربر انتخاب‌شده نقش مدرس فعال ندارد.");
  }

  private async assertCategories(
    transaction: Prisma.TransactionClient,
    categoryIds: string[],
  ) {
    if (!categoryIds.length) return;
    const count = await transaction.category.count({
      where: { id: { in: categoryIds } },
    });
    if (count !== categoryIds.length) {
      throw new BadRequestException("یک یا چند دسته‌بندی انتخاب‌شده پیدا نشد.");
    }
  }

  private upsertCategory(
    transaction: Prisma.TransactionClient,
    input: CourseCategoryDto | null | undefined,
  ) {
    if (!input) return null;
    return transaction.category.upsert({
      where: { slug: input.slug },
      update: { name: input.name },
      create: { name: input.name, slug: input.slug },
      select: { id: true },
    });
  }

  private throwForUniqueConstraint(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ConflictException("این نشانی یا دسته‌بندی قبلاً استفاده شده است.");
    }
  }
}
