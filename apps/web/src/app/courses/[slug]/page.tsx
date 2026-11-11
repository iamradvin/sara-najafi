import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PageLayout } from "@/components/site-shell";
import { CoursePurchase } from "@/components/course-purchase";
import { courseImageUrl } from "@/lib/api";
import { applyCourseBranding } from "@/lib/courses";
import { formatTomanAmount } from "@/lib/format-price";
import { serverApiUrl } from "@/lib/server-api";
import { BrandLogo } from "@/components/brand-logo";
import type { Course } from "@/lib/courses";
import type { PublishedCourseDetails } from "@attractory/types";

const levelLabels: Record<PublishedCourseDetails["level"], string> = {
  BEGINNER: "مقدماتی",
  INTERMEDIATE: "متوسط",
  ADVANCED: "پیشرفته",
  ALL_LEVELS: "مناسب همه",
};

export const dynamic = "force-dynamic";

type CourseRouteProps = { params: Promise<{ slug: string }> };

async function findCourse(slug: string): Promise<Course | null> {
  const response = await fetch(serverApiUrl(`/courses/${encodeURIComponent(slug)}`), {
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("دریافت اطلاعات دوره از سرور انجام نشد.");

  const published = (await response.json()) as PublishedCourseDetails;
  const category = published.categories[0]?.category;
  return applyCourseBranding({
    slug: published.slug,
    title: published.title,
    description: published.description,
    longDescription: published.description,
    image: published.thumbnailUrl ?? "",
    category: category?.slug ?? "general",
    categoryLabel: category?.name ?? "آموزشی",
    duration: published.estimatedMinutes
      ? `${published.estimatedMinutes.toLocaleString("fa-IR")} دقیقه`
      : "آموزش آنلاین",
    lessons: `${published.sections.length.toLocaleString("fa-IR")} فصل`,
    level: levelLabels[published.level],
    price: published.priceToman == null ? undefined : formatTomanAmount(published.priceToman),
    isFree: published.isFree,
    label: "دوره آموزشی",
    number: "AS",
    outcomes: [],
    curriculum: published.sections.flatMap((section) =>
      section.lessons.map((lesson) => lesson.title),
    ),
  });
}

export async function generateMetadata({ params }: CourseRouteProps) {
  const { slug } = await params;
  const course = await findCourse(slug);
  return {
    title: course ? `${course.title} | سارا نجفی` : "دوره پیدا نشد",
    description: course?.description,
  };
}

export default async function CourseDetailPage({ params }: CourseRouteProps) {
  const { slug } = await params;
  const course = await findCourse(slug);
  if (!course) notFound();

  return (
    <PageLayout>
      <section className="container inner-page course-detail-page">
        <Link className="back-link" href="/courses">← بازگشت به دوره‌ها</Link>
        <div className="course-detail">
          <div className="detail-main">
            <div className="detail-cover">
              {course.image ? (
                <Image
                  src={courseImageUrl(course.image)}
                  alt={course.title}
                  fill
                  priority
                  sizes="(max-width: 680px) 100vw, 60vw"
                  unoptimized={course.image.startsWith("/uploads/")}
                />
              ) : (
                <span className="course-placeholder">
                  <span className="course-placeholder__mark" aria-hidden="true">
                    <BrandLogo size={52} />
                  </span>
                  <span className="course-placeholder__copy">
                    <small>آموزش تخصصی</small>
                    <strong>{course.title}</strong>
                  </span>
                </span>
              )}
              <span className="detail-cover-badge">{course.categoryLabel}</span>
            </div>
            <div className="detail-pills">
              <span className="pill">{course.level}</span>
              <span className="pill pill--muted">{course.duration}</span>
              <span className="pill pill--muted">{course.lessons}</span>
            </div>
            <h1>{course.title}</h1>
            <p className="detail-lead">{course.description}</p>
            {course.instructor && (
              <p className="course-instructor-link">
                مدرس: <Link href={`/instructors/${course.instructor.id}`}>{course.instructor.name}</Link>
              </p>
            )}
            <h2>درباره این دوره</h2>
            <p>{course.longDescription}</p>
            {course.outcomes.length > 0 && (
              <>
                <h2>بعد از این مسیر چه چیزهایی یاد می‌گیری؟</h2>
                <ul className="purchase-features">
                  {course.outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}
                </ul>
              </>
            )}
            {course.curriculum.length > 0 && (
              <>
                <h2>سرفصل‌های دوره</h2>
                <div className="curriculum">
                  {course.curriculum.map((lesson, index) => (
                    <div className="curriculum-row" key={`${index}-${lesson}`}>
                      <span>{String(index + 1).padStart(2, "0")} &nbsp; {lesson}</span>
                      <small>بخش {index + 1}</small>
                    </div>
                  ))}
                </div>
              </>
            )}
            <h2>جلسات ویدیویی دوره</h2>
            <p className="course-video-disclosure">
              پخش ویدیو در حال حاضر غیرفعال است. دسترسی به جلسه‌ها پس از فراهم‌شدن زیرساخت پخش امن فعال می‌شود.
            </p>
            <div className="course-media-locked" role="status">
              <span aria-hidden="true">▣</span>
              <strong>ویدیوها تا فعال‌شدن پخش امن در دسترس نیستند</strong>
              <small>وضعیت دسترسی به جلسه‌ها از همین صفحه قابل پیگیری است.</small>
            </div>
          </div>
          <aside className="purchase-card">
            <CoursePurchase slug={course.slug} />
            <ul className="purchase-features">
              <li>{course.lessons}؛ پخش ویدیو در حال حاضر غیرفعال است</li>
              <li>آموزش قدم‌به‌قدم</li>
              <li>دسترسی ویدیویی پس از فراهم‌شدن زیرساخت امن</li>
              <li>دسترسی از موبایل و دسکتاپ</li>
            </ul>
          </aside>
        </div>
      </section>
    </PageLayout>
  );
}
