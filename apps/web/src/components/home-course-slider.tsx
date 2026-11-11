"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { applyCourseBranding, type Course } from "@/lib/courses";
import { CourseCard } from "@/components/course-card";
import { AutoSlider } from "@/components/auto-slider";
import type { PublishedCourseSummary } from "@attractory/types";
import { formatTomanAmount } from "@/lib/format-price";

const levelLabels: Record<PublishedCourseSummary["level"], string> = {
  BEGINNER: "مقدماتی",
  INTERMEDIATE: "متوسط",
  ADVANCED: "پیشرفته",
  ALL_LEVELS: "مناسب همه",
};

const upcomingCourses: Course[] = [
  {
    slug: "brushing-hair",
    category: "hair-styling",
    categoryLabel: "براشینگ مو",
    title: "دوره براشینگ مو تخصصی",
    description: "مسیر آموزشی تخصصی براشینگ مو.",
    image: "",
    duration: "اطلاعات به‌زودی",
    lessons: "به‌زودی",
    level: "مناسب همه",
    label: "به‌زودی",
    number: "SN",
    longDescription: "اطلاعات ثبت‌نام این دوره به‌زودی اعلام می‌شود.",
    outcomes: [],
    curriculum: [],
  },
  {
    slug: "keratin-hair-recovery",
    category: "hair-care",
    categoryLabel: "کراتین و احیا",
    title: "دوره تخصصی کراتین و احیا",
    description: "مسیر آموزشی تخصصی کراتین، احیا و مراقبت از مو.",
    image: "",
    duration: "اطلاعات به‌زودی",
    lessons: "به‌زودی",
    level: "مناسب همه",
    label: "به‌زودی",
    number: "SN",
    longDescription: "اطلاعات ثبت‌نام این دوره به‌زودی اعلام می‌شود.",
    outcomes: [],
    curriculum: [],
  },
];

function toCourse(course: PublishedCourseSummary): Course {
  const category = course.categories[0]?.category;
  return applyCourseBranding({
    slug: course.slug,
    title: course.title,
    description: course.description,
    image: course.thumbnailUrl ?? "",
    category: category?.slug ?? "general",
    categoryLabel: category?.name ?? "آموزشی",
    duration: course.estimatedMinutes
      ? `${course.estimatedMinutes.toLocaleString("fa-IR")} دقیقه`
      : "آموزش آنلاین",
    lessons: `${course._count.sections.toLocaleString("fa-IR")} فصل`,
    level: levelLabels[course.level],
    price: course.isFree
      ? "رایگان"
      : course.priceToman
        ? formatTomanAmount(course.priceToman)
        : undefined,
    isFree: course.isFree,
    label: "دوره آموزشی",
    number: "SN",
    longDescription: course.description,
    outcomes: [],
    curriculum: [],
  });
}

export function HomeCourseSlider() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    apiClient.courses.listPublished({ cache: "no-store", signal: controller.signal })
      .then((published) => {
        if (controller.signal.aborted) return;
        const publishedCourses = published.data.map(toCourse);
        const nextCourses = [
          ...publishedCourses,
          ...upcomingCourses.filter((upcoming) =>
            !publishedCourses.some((course) => course.title === upcoming.title),
          ),
        ].slice(0, 3);
        setCourses(nextCourses);
        setLoadState(nextCourses.length ? "ready" : "empty");
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setLoadState("error");
      });

    return () => controller.abort();
  }, [retryCount]);

  return (
    <>
      {loadState === "loading" && !courses.length && (
        <div className="home-courses-state" role="status" aria-live="polite">
          <span className="home-courses-state__mark" aria-hidden="true">SN</span>
          <span>دوره‌ها در حال بارگذاری‌اند…</span>
        </div>
      )}
      {loadState === "error" && (
        <div className="home-courses-state" role="alert">
          <span className="home-courses-state__mark" aria-hidden="true">!</span>
          <div><strong>دوره‌ها بارگیری نشدند.</strong><span>اتصال اینترنت را بررسی کن و دوباره تلاش کن.</span></div>
          <button
            className="button button--outline button--small"
            onClick={() => {
              setLoadState("loading");
              setRetryCount((count) => count + 1);
            }}
            type="button"
          >
            تلاش دوباره
          </button>
        </div>
      )}
      {loadState === "empty" && (
        <div className="home-courses-state" role="status">
          <span className="home-courses-state__mark" aria-hidden="true">SN</span>
          <div><strong>دوره‌ای برای نمایش نیست.</strong><span>برای دیدن مسیرهای دیگر، کتابخانهٔ دوره‌ها را ببین.</span></div>
          <Link className="button button--outline button--small" href="/courses">رفتن به دوره‌ها</Link>
        </div>
      )}
      {courses.length > 0 && (
        <AutoSlider
          className="home-card-slider home-course-slider"
          items={courses.map((course) => (
            <CourseCard
              course={course}
              href={course.label === "به‌زودی" ? "/courses" : undefined}
              key={course.slug}
              variant="home"
            />
          ))}
          label="دوره‌های آموزشی سارا نجفی"
          desktopItemsPerPage={2}
          mobileItemsPerPage={2}
          overlapOnMobile
          pageClassName="home-card-rail"
          tabletItemsPerPage={2}
        />
      )}
    </>
  );
}
