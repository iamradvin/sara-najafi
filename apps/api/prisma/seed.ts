import {
  CourseLevel,
  CourseStatus,
  PrismaClient,
  UserStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

type SeedCourse = {
  slug: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  level: CourseLevel;
  priceToman: number | null;
  isFree: boolean;
  estimatedMinutes: number;
  status: CourseStatus;
  category: { name: string; slug: string };
  section?: {
    title: string;
    lessons: { title: string }[];
  };
};

const seedCourses: SeedCourse[] = [
  {
    slug: "confidence-in-public",
    title: "اعتمادبه‌نفس در جمع",
    description: "آموزشی درباره‌ی اعتمادبه‌نفس در جمع و حضور آگاهانه‌تر در موقعیت‌های ارتباطی.",
    thumbnailUrl: "/assets/confidence-in-public.png",
    level: CourseLevel.ALL_LEVELS,
    priceToman: null,
    isFree: false,
    estimatedMinutes: 0,
    status: CourseStatus.PUBLISHED,
    category: { name: "اعتمادبه‌نفس", slug: "confidence" },
    section: {
      title: "جلسات ویدیویی دوره",
      lessons: [
        { title: "بخش اول" },
        { title: "بخش دوم" },
        { title: "بخش سوم" },
      ],
    },
  },
  {
    slug: "mindset",
    title: "ذهنیت (Mindset)",
    description: "آموزشی درباره‌ی ذهنیت و نقش آن در نگاه‌کردن به موقعیت‌ها و انتخاب مسیر رشد فردی.",
    thumbnailUrl: null,
    level: CourseLevel.ALL_LEVELS,
    priceToman: 1_900_000,
    isFree: false,
    estimatedMinutes: 0,
    status: CourseStatus.DRAFT,
    category: { name: "ذهنیت", slug: "mindset" },
  },
  {
    slug: "lifestyle",
    title: "سبک زندگی",
    description: "نگاهی به انتخاب‌های روزمره و نقش آن‌ها در شکل‌دادن به کیفیت زندگی.",
    thumbnailUrl: null,
    level: CourseLevel.ALL_LEVELS,
    priceToman: 1_900_000,
    isFree: false,
    estimatedMinutes: 0,
    status: CourseStatus.DRAFT,
    category: { name: "سبک زندگی", slug: "lifestyle" },
  },
  {
    slug: "formula-khorooj",
    title: "فرمول خروج",
    description: "جزئیات محتوای این دوره پس از نهایی‌شدن در صفحه‌ی آن اعلام می‌شود.",
    thumbnailUrl: null,
    level: CourseLevel.ALL_LEVELS,
    priceToman: 1_900_000,
    isFree: false,
    estimatedMinutes: 0,
    status: CourseStatus.DRAFT,
    category: { name: "رشد فردی", slug: "personal-growth" },
  },
  {
    slug: "body-language",
    title: "زبان بدن",
    description: "آموزشی درباره‌ی زبان بدن و نقش نشانه‌های غیرکلامی در ارتباط میان افراد.",
    thumbnailUrl: null,
    level: CourseLevel.ALL_LEVELS,
    priceToman: 900_000,
    isFree: false,
    estimatedMinutes: 0,
    status: CourseStatus.DRAFT,
    category: { name: "ارتباط مؤثر", slug: "communication" },
  },
  {
    slug: "hunter",
    title: "هانتر",
    description: "جزئیات محتوای این دوره پس از نهایی‌شدن در صفحه‌ی آن اعلام می‌شود.",
    thumbnailUrl: null,
    level: CourseLevel.ALL_LEVELS,
    priceToman: 2_900_000,
    isFree: false,
    estimatedMinutes: 0,
    status: CourseStatus.DRAFT,
    category: { name: "آموزش", slug: "education" },
  },
  {
    slug: "one-person-business",
    title: "کسب‌وکار تک‌نفره",
    description: "آموزشی در حوزه‌ی کسب‌وکار فردی و مهارت‌های حرفه‌ای؛ توضیحات نهایی با انتشار دوره ارائه می‌شود.",
    thumbnailUrl: null,
    level: CourseLevel.ALL_LEVELS,
    priceToman: 2_900_000,
    isFree: false,
    estimatedMinutes: 0,
    status: CourseStatus.DRAFT,
    category: { name: "کسب‌وکار", slug: "business" },
  },
];

async function seed() {
  const permissions = [
    ["courses:read", "مشاهده دوره‌ها"],
    ["courses:manage", "مدیریت دوره‌ها"],
    ["users:manage", "مدیریت کاربران"],
  ] as const;

  for (const [key, description] of permissions) {
    await prisma.permission.upsert({
      where: { key },
      update: { description },
      create: { key, description },
    });
  }

  const adminRole = await prisma.role.upsert({
    where: { name: "SUPER_ADMIN" },
    update: { description: "مدیریت کامل سامانه" },
    create: { name: "SUPER_ADMIN", description: "مدیریت کامل سامانه" },
  });

  if (process.env.STAGING_FIXED_OTP_ENABLED === "true") {
    if (process.env.APP_ENV !== "staging") {
      throw new Error("Fixed OTP admin seeding is only available in staging.");
    }

    const configuredPhone = process.env.STAGING_FIXED_OTP_PHONE?.trim();
    const configuredCode = process.env.STAGING_FIXED_OTP_CODE?.trim();
    if (!configuredPhone || !/^09\d{9}$/.test(configuredPhone) || !configuredCode || !/^\d{6}$/.test(configuredCode)) {
      throw new Error("A valid staging phone and six-digit OTP are required for fixed OTP admin seeding.");
    }

    const phone = `+98${configuredPhone.slice(1)}`;
    const stagingAdmin = await prisma.user.upsert({
      where: { phone },
      update: {},
      create: {
        phone,
        name: "مدیر سامانه",
        roles: { create: { roleId: adminRole.id } },
      },
      select: { id: true, status: true, deletedAt: true },
    });
    if (stagingAdmin.status !== UserStatus.ACTIVE || stagingAdmin.deletedAt) {
      throw new Error("The configured staging admin account is inactive.");
    }
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: stagingAdmin.id, roleId: adminRole.id } },
      update: {},
      create: { userId: stagingAdmin.id, roleId: adminRole.id },
    });
  }

  await prisma.role.upsert({
    where: { name: "STUDENT" },
    update: { description: "دانشجوی سامانه" },
    create: { name: "STUDENT", description: "دانشجوی سامانه" },
  });

  await prisma.role.upsert({
    where: { name: "INSTRUCTOR" },
    update: { description: "مدرس دوره‌های آموزشی" },
    create: { name: "INSTRUCTOR", description: "مدرس دوره‌های آموزشی" },
  });

  for (const permission of await prisma.permission.findMany()) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: permission.id },
    });
  }

  await prisma.course.updateMany({
    where: { slug: { in: ["strength", "nutrition", "lifestyle", "form"] }, deletedAt: null },
    data: { status: CourseStatus.ARCHIVED, publishedAt: null },
  });

  for (const courseData of seedCourses) {
    const category = await prisma.category.upsert({
      where: { slug: courseData.category.slug },
      update: { name: courseData.category.name },
      create: courseData.category,
    });

    const course = await prisma.course.upsert({
      where: { slug: courseData.slug },
      update: {
        title: courseData.title,
        description: courseData.description,
        thumbnailUrl: courseData.thumbnailUrl,
        level: courseData.level,
        priceToman: courseData.priceToman,
        isFree: courseData.isFree,
        estimatedMinutes: courseData.estimatedMinutes,
        status: courseData.status,
        publishedAt: courseData.status === CourseStatus.PUBLISHED ? new Date() : null,
        deletedAt: null,
      },
      create: {
        slug: courseData.slug,
        title: courseData.title,
        description: courseData.description,
        thumbnailUrl: courseData.thumbnailUrl,
        level: courseData.level,
        priceToman: courseData.priceToman,
        isFree: courseData.isFree,
        estimatedMinutes: courseData.estimatedMinutes,
        status: courseData.status,
        publishedAt: courseData.status === CourseStatus.PUBLISHED ? new Date() : null,
        categories: { create: { categoryId: category.id } },
      },
    });

    if (courseData.section) {
      const section = await prisma.courseSection.upsert({
        where: { courseId_position: { courseId: course.id, position: 1 } },
        update: { title: courseData.section.title },
        create: { courseId: course.id, title: courseData.section.title, position: 1 },
      });

      for (const [index, lesson] of courseData.section.lessons.entries()) {
        await prisma.lesson.upsert({
          where: { sectionId_position: { sectionId: section.id, position: index + 1 } },
          update: { title: lesson.title, videoKey: null, isPreview: false },
          create: {
            sectionId: section.id,
            title: lesson.title,
            videoKey: null,
            isPreview: false,
            position: index + 1,
          },
        });
      }
    }

    await prisma.courseCategory.upsert({
      where: { courseId_categoryId: { courseId: course.id, categoryId: category.id } },
      update: {},
      create: { courseId: course.id, categoryId: category.id },
    });
  }

  await prisma.brandSetting.upsert({
    where: { key: "brand" },
    update: {
      value: {
        name: "SaraNajafi",
        locale: "fa-IR",
        direction: "rtl",
        colors: { background: "#200910", primary: "#200910", secondary: "#BC9C8F" },
      },
    },
    create: {
      key: "brand",
      value: {
        name: "SaraNajafi",
        locale: "fa-IR",
        direction: "rtl",
        colors: { background: "#200910", primary: "#200910", secondary: "#BC9C8F" },
      },
    },
  });
}

seed()
  .then(async () => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error("Database seed failed", error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
