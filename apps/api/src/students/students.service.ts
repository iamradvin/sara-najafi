import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { EnrollmentStatus, Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateLessonProgressDto } from "./lesson-progress.dto";
import { VdoCipherService } from "./vdocipher.service";

const activeEnrollment = (userId: string) => ({
  some: {
    userId,
    status: EnrollmentStatus.ACTIVE,
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
  },
});

const orderInclude = {
  items: { select: { courseTitle: true, unitPriceToman: true } },
  payments: {
    select: {
      status: true,
      provider: true,
      providerTransactionId: true,
      createdAt: true,
      verifiedAt: true,
    },
  },
} satisfies Prisma.OrderInclude;

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vdocipher: VdoCipherService,
  ) {}

  async listCourses(userId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        userId,
        status: EnrollmentStatus.ACTIVE,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        course: { deletedAt: null },
      },
      orderBy: { enrolledAt: "desc" },
      select: {
        id: true,
        enrolledAt: true,
        expiresAt: true,
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
            thumbnailUrl: true,
            categories: { select: { category: { select: { name: true } } } },
            courseProgress: {
              where: { userId },
              select: { lastLessonId: true, lastAccessedAt: true, completedAt: true },
            },
            sections: {
              orderBy: { position: "asc" },
              select: {
                lessons: {
                  where: { isPublished: true },
                  orderBy: { position: "asc" },
                  select: {
                    id: true,
                    title: true,
                    durationSec: true,
                    videoKey: true,
                    progress: {
                      where: { userId },
                      select: { isComplete: true, watchedSeconds: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return enrollments.map(({ course, ...enrollment }) => {
      const lessons = course.sections.flatMap((section) => section.lessons);
      const progress = lessons.flatMap((lesson) => lesson.progress);
      const completedLessons = progress.filter((item) => item.isComplete).length;
      const watchedSeconds = progress.reduce((total, item) => total + item.watchedSeconds, 0);
      const courseProgress = course.courseProgress[0];
      return {
        ...enrollment,
        course: {
          id: course.id,
          slug: course.slug,
          title: course.title,
          thumbnailUrl: course.thumbnailUrl,
          category: course.categories[0]?.category.name ?? "بدون دسته",
        },
        lessons: lessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          durationSec: lesson.durationSec,
          videoReady: Boolean(lesson.videoKey),
          isComplete: lesson.progress.some((item) => item.isComplete),
        })),
        totalLessons: lessons.length,
        completedLessons,
        watchedSeconds,
        lastLessonId: courseProgress?.lastLessonId ?? null,
        lastAccessedAt: courseProgress?.lastAccessedAt ?? null,
        completedAt: courseProgress?.completedAt ?? null,
        progressPercent: lessons.length
          ? Math.round((completedLessons / lessons.length) * 100)
          : 0,
      };
    });
  }

  async getCourseLearning(userId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        userId,
        courseId,
        status: EnrollmentStatus.ACTIVE,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        course: { deletedAt: null },
      },
      select: {
        id: true,
        enrolledAt: true,
        expiresAt: true,
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            thumbnailUrl: true,
            estimatedMinutes: true,
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
                    videoKey: true,
                    position: true,
                    resources: { orderBy: { position: "asc" } },
                    progress: {
                      where: { userId },
                      select: {
                        watchedSeconds: true,
                        coveredSeconds: true,
                        isComplete: true,
                        lastWatchedAt: true,
                      },
                    },
                  },
                },
              },
            },
            courseProgress: {
              where: { userId },
              select: { lastLessonId: true, lastAccessedAt: true, completedAt: true },
            },
          },
        },
      },
    });
    if (!enrollment) {
      const course = await this.prisma.course.findFirst({
        where: { id: courseId, deletedAt: null },
        select: { id: true },
      });
      if (!course) throw new NotFoundException("دوره پیدا نشد.");
      throw new ForbiddenException("برای مشاهده محتوای دوره باید ثبت‌نام فعال داشته باشی.");
    }

    const lessons = enrollment.course.sections.flatMap((section) => section.lessons);
    const completedLessons = lessons.filter((lesson) =>
      lesson.progress.some((progress) => progress.isComplete),
    ).length;
    const state = enrollment.course.courseProgress[0];
    return {
      enrollment: { id: enrollment.id, enrolledAt: enrollment.enrolledAt, expiresAt: enrollment.expiresAt },
      course: {
        ...enrollment.course,
        sections: enrollment.course.sections,
        progress: {
          totalLessons: lessons.length,
          completedLessons,
          progressPercent: lessons.length
            ? Math.round((completedLessons / lessons.length) * 100)
            : 0,
          lastLessonId: state?.lastLessonId ?? null,
          lastAccessedAt: state?.lastAccessedAt ?? null,
          completedAt: state?.completedAt ?? null,
        },
      },
    };
  }

  async getLessonPlayback(userId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: {
        id: lessonId,
        isPublished: true,
        videoKey: { not: null },
        section: { course: { deletedAt: null } },
        OR: [
          { section: { course: { enrollments: activeEnrollment(userId) } } },
          { isPreview: true, section: { course: { status: "PUBLISHED" } } },
        ],
      },
      select: {
        title: true,
        videoKey: true,
        section: { select: { course: { select: { title: true } } } },
      },
    });

    if (!lesson || !lesson.videoKey) {
      const exists = await this.prisma.lesson.findUnique({
        where: { id: lessonId },
        select: { id: true },
      });
      if (!exists) throw new NotFoundException("جلسه پیدا نشد.");
      throw new ForbiddenException("دسترسی فعال به این ویدیو نداری.");
    }

    const token = await this.vdocipher.createPlaybackToken(lesson.videoKey);
    return {
      ...token,
      lessonTitle: lesson.title,
      courseTitle: lesson.section.course.title,
      expiresInSeconds: 300,
    };
  }

  async updateLessonProgress(userId: string, lessonId: string, input: UpdateLessonProgressDto) {
    const lesson = await this.prisma.lesson.findFirst({
      where: {
        id: lessonId,
        isPublished: true,
        section: {
          course: {
            deletedAt: null,
            enrollments: activeEnrollment(userId),
          },
        },
      },
      select: { id: true, durationSec: true, section: { select: { courseId: true } } },
    });

    if (!lesson) {
      const exists = await this.prisma.lesson.findUnique({
        where: { id: lessonId },
        select: { id: true },
      });
      if (!exists) throw new NotFoundException("جلسه پیدا نشد.");
      throw new ForbiddenException("دسترسی فعال به این درس نداری.");
    }

    const maxDuration = lesson.durationSec;
    const watchedSeconds = Math.min(input.watchedSeconds, maxDuration);
    const coveredSeconds = Math.min(input.coveredSeconds, maxDuration);
    const isComplete = maxDuration === 0 || coveredSeconds >= Math.ceil(maxDuration * 0.9);

    const saved = await this.prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw`
        INSERT INTO "LessonProgress"
          ("id", "userId", "lessonId", "watchedSeconds", "coveredSeconds", "isComplete", "lastWatchedAt")
        VALUES
          (${randomUUID()}::uuid, ${userId}::uuid, ${lessonId}::uuid, ${watchedSeconds}, ${coveredSeconds}, ${isComplete}, CURRENT_TIMESTAMP)
        ON CONFLICT ("userId", "lessonId") DO UPDATE SET
          "watchedSeconds" = GREATEST("LessonProgress"."watchedSeconds", EXCLUDED."watchedSeconds"),
          "coveredSeconds" = GREATEST("LessonProgress"."coveredSeconds", EXCLUDED."coveredSeconds"),
          "isComplete" = "LessonProgress"."isComplete" OR EXCLUDED."isComplete",
          "lastWatchedAt" = CURRENT_TIMESTAMP
      `;
      const progress = await transaction.lessonProgress.findUniqueOrThrow({
        where: { userId_lessonId: { userId, lessonId } },
        select: { watchedSeconds: true, coveredSeconds: true, isComplete: true },
      });
      const totalLessons = await transaction.lesson.count({
        where: { isPublished: true, section: { courseId: lesson.section.courseId } },
      });
      const completedLessons = await transaction.lessonProgress.count({
        where: {
          userId,
          isComplete: true,
          lesson: { isPublished: true, section: { courseId: lesson.section.courseId } },
        },
      });
      await transaction.courseProgress.upsert({
        where: {
          userId_courseId: { userId, courseId: lesson.section.courseId },
        },
        update: {
          lastLessonId: lessonId,
          lastAccessedAt: new Date(),
          completedAt:
            totalLessons > 0 && completedLessons >= totalLessons ? new Date() : null,
        },
        create: {
          userId,
          courseId: lesson.section.courseId,
          lastLessonId: lessonId,
          completedAt:
            totalLessons > 0 && completedLessons >= totalLessons ? new Date() : null,
        },
      });
      return progress;
    });
    return {
      ...saved,
      progressPercent: maxDuration
        ? Math.min(100, Math.floor((saved.coveredSeconds / maxDuration) * 100))
        : saved.isComplete ? 100 : 0,
    };
  }

  listOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: orderInclude,
    });
  }
}
