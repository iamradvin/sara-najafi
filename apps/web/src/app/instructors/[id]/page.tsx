import Image from "next/image";
import { notFound } from "next/navigation";
import { CourseCard } from "@/components/course-card";
import { applyCourseBranding } from "@/lib/courses";
import { formatTomanAmount } from "@/lib/format-price";
import { PageLayout } from "@/components/site-shell";
import { serverApiUrl } from "@/lib/server-api";
import type { Course } from "@/lib/courses";
import type { PublishedCourseSummary } from "@attractory/types";

type InstructorProfile = {
  id: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  instructorCourses: PublishedCourseSummary[];
};

const levelLabels: Record<PublishedCourseSummary["level"], string> = {
  BEGINNER: "مقدماتی",
  INTERMEDIATE: "متوسط",
  ADVANCED: "پیشرفته",
  ALL_LEVELS: "مناسب همه",
};

function mapCourse(course: PublishedCourseSummary): Course {
  const category = course.categories[0]?.category;
  return applyCourseBranding({
    slug: course.slug,
    title: course.title,
    description: course.description,
    image: course.thumbnailUrl ?? "",
    category: category?.slug ?? "general",
    categoryLabel: category?.name ?? "آموزشی",
    duration: course.estimatedMinutes ? `${course.estimatedMinutes.toLocaleString("fa-IR")} دقیقه` : "آموزش آنلاین",
    lessons: `${course._count.sections.toLocaleString("fa-IR")} فصل`,
    level: levelLabels[course.level],
    price: course.isFree
      ? "رایگان"
      : course.priceToman == null
        ? undefined
        : formatTomanAmount(course.priceToman),
    label: "دوره آموزشی",
    number: "SN",
    longDescription: course.description,
    outcomes: [],
    curriculum: [],
  });
}

export default async function InstructorProfilePage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const response = await fetch(serverApiUrl(`/instructors/${encodeURIComponent(id)}`), {
    cache: "no-store",
  });
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error("دریافت پروفایل مدرس انجام نشد.");
  const instructor = (await response.json()) as InstructorProfile;

  return (
    <PageLayout>
      <section className="container inner-page instructor-profile">
        <div className="instructor-profile-card">
          <Image alt="سارا نجفی" height={112} src="/images/sara-najafi.jpg" width={112} />
          <div><div className="eyebrow">مدرس دوره‌ها</div><h1>سارا نجفی</h1><p>آموزش‌های تخصصی رنگ مو، لایت، بالیاژ و مراقبت از مو.</p></div>
        </div>
        <h2>دوره‌های منتشرشده</h2>
        {instructor.instructorCourses.length ? (
          <div className="course-grid course-grid--listing">
            {instructor.instructorCourses.map((course) => <CourseCard course={mapCourse(course)} key={course.id} />)}
          </div>
        ) : <div className="empty-state">این مدرس هنوز دورهٔ منتشرشده‌ای ندارد.</div>}
      </section>
    </PageLayout>
  );
}
