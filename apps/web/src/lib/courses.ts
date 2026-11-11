export type Course = {
  slug: string;
  category: string;
  categoryLabel: string;
  title: string;
  description: string;
  image: string;
  duration: string;
  lessons: string;
  level: string;
  price?: string;
  isFree?: boolean;
  oldPrice?: string;
  label: string;
  number: string;
  longDescription: string;
  outcomes: string[];
  curriculum: string[];
  instructor?: { id: string; name: string };
};

const brandCourseContent: Omit<Course, "slug" | "price" | "isFree" | "oldPrice" | "instructor"> = {
  category: "hair-color",
  categoryLabel: "زیبایی مو",
  title: "دوره تخصصی زیبایی مو",
  description: "آموزش تخصصی رنگ مو، لایت و تکنیک‌های مراقبت از مو.",
  image: "",
  duration: "آموزش آنلاین",
  lessons: "دوره تخصصی",
  level: "مناسب همه",
  label: "دوره آموزشی",
  number: "SN",
  longDescription: "با آموزش‌های تخصصی سارا نجفی، با حوزه‌های رنگ، لایت و مراقبت از مو آشنا شو.",
  outcomes: [],
  curriculum: [],
};

const courseContentBySlug: Record<string, Partial<typeof brandCourseContent>> = {
  "confidence-in-public": {
    categoryLabel: "رنگ و لایت",
    title: "دوره رنگ و لایت مو تخصصی",
    description: "آموزش تخصصی رنگ مو و تکنیک‌های لایت، از شناخت پایه‌ها تا اجرای ترکیب‌های حرفه‌ای.",
    longDescription: "در این دوره با اصول رنگ‌شناسی، شناخت پایه‌های رنگ و اجرای تکنیک‌های تخصصی لایت آشنا شو.",
    curriculum: [
      "اصول ترکیب رنگ مو",
      "شناخت پایه‌های رنگ و دکلره",
      "مبانی مراقبت از موهای رنگ‌شده",
    ],
  },
};

export function applyCourseBranding(course: Course): Course {
  return {
    ...course,
    ...brandCourseContent,
    ...courseContentBySlug[course.slug],
    instructor: undefined,
  };
}

export function getBrandCourseTitle(slug: string): string {
  return courseContentBySlug[slug]?.title ?? brandCourseContent.title;
}

export function getBrandCourseTitleFromStoredTitle(title: string): string {
  return title.includes("اعتمادبه‌نفس") ? getBrandCourseTitle("confidence-in-public") : brandCourseContent.title;
}

export function getBrandCourseDescription(slug: string): string {
  return courseContentBySlug[slug]?.description ?? brandCourseContent.description;
}

export function getBrandCourseCategoryLabel(slug: string): string {
  return courseContentBySlug[slug]?.categoryLabel ?? brandCourseContent.categoryLabel;
}

export function getBrandCourseLessonTitle(slug: string, index: number): string {
  return courseContentBySlug[slug]?.curriculum?.[index] ?? "جلسه تخصصی زیبایی مو";
}

export const courses: Course[] = [
  applyCourseBranding({
    slug: "confidence-in-public",
    category: "hair-color",
    categoryLabel: "رنگ مو",
    title: "دوره رنگ و لایت مو تخصصی",
    description: "آشنایی با اصول رنگ‌شناسی و تکنیک‌های تخصصی رنگ مو.",
    image: "",
    duration: "آموزش آنلاین",
    lessons: "۳ جلسه",
    level: "مناسب همه",
    label: "دوره آموزشی",
    number: "SN",
    longDescription: "آشنایی با اصول رنگ‌شناسی، شناخت پایه‌های رنگ و مراقبت از موهای رنگ‌شده.",
    outcomes: [],
    curriculum: ["اصول ترکیب رنگ مو", "شناخت پایه‌های رنگ و دکلره", "مبانی مراقبت از موهای رنگ‌شده"],
  }),
];
