"use client";

import { useEffect, useMemo, useState } from "react";
import { CourseCard } from "@/components/course-card";
import { applyCourseBranding, type Course } from "@/lib/courses";
import { apiClient } from "@/lib/api";
import { formatTomanAmount } from "@/lib/format-price";
import type { CourseListQuery, PublishedCourseSummary } from "@attractory/types";

const levelLabels: Record<PublishedCourseSummary["level"], string> = {
  BEGINNER: "مقدماتی",
  INTERMEDIATE: "متوسط",
  ADVANCED: "پیشرفته",
  ALL_LEVELS: "مناسب همه",
};

function fromPublishedCourse(course: PublishedCourseSummary): Course {
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

type Category = { id: string; name: string; slug: string };
const PAGE_SIZE = 12;

export function CourseList() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<CourseListQuery["sort"]>("newest");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    apiClient.get<Category[]>("/categories", { cache: "no-store", signal: controller.signal })
      .then(setCategories)
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setLoadError(cause instanceof Error ? cause.message : "دریافت دسته‌بندی‌ها انجام نشد.");
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      setLoadError("");
      apiClient.courses.searchPublished({
        page,
        limit: PAGE_SIZE,
        category: category === "all" ? undefined : category,
        search: query.trim() || undefined,
        sort,
      }, { cache: "no-store", signal: controller.signal })
        .then((result) => {
          setCourses(result.data.map(fromPublishedCourse));
          setPages(result.meta.pages);
          setTotal(result.meta.total);
        })
        .catch((cause: unknown) => {
          if (cause instanceof DOMException && cause.name === "AbortError") return;
          setLoadError(cause instanceof Error ? cause.message : "دریافت دوره‌ها انجام نشد.");
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, query ? 250 : 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [category, page, query, sort]);

  const filters = useMemo(
    () => [
      { id: "all", label: "همه دوره‌ها" },
      ...categories.map(({ slug }) => ({
        id: slug,
        label: slug === "confidence" ? "رنگ و لایت مو" : "زیبایی مو",
      })),
    ],
    [categories],
  );

  function changeCategory(value: string) {
    setCategory(value);
    setPage(1);
  }

  return (
    <>
      {loadError && courses.length > 0 && <p className="auth-error" role="alert">به‌روزرسانی دوره‌ها انجام نشد؛ نتایج قبلی همچنان نمایش داده می‌شوند.</p>}
      <div className="course-toolbar">
        <div className="filter-tabs" role="group" aria-label="فیلتر دوره‌ها">
          {filters.map((filter) => (
            <button
              aria-pressed={category === filter.id}
              className={`filter-tab${category === filter.id ? " is-selected" : ""}`}
              key={filter.id}
              onClick={() => changeCategory(filter.id)}
              type="button"
            >
              {filter.label}
              {filter.id === "all" && <span>{total.toLocaleString("fa-IR")}</span>}
            </button>
          ))}
        </div>
        <label className="search-box">
          <span aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="10.8" cy="10.8" r="6.3" />
              <path d="m15.4 15.4 4.1 4.1" />
            </svg>
          </span>
          <input
            aria-label="جست‌وجوی دوره"
            onChange={(event) => { setQuery(event.target.value); setPage(1); }}
            placeholder="دنبال چه چیزی می‌گردی؟"
            type="search"
            value={query}
          />
        </label>
        <label className="course-sort">
          <span className="course-sort-heading">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M7 12h10m-7 6h4" />
            </svg>
            <span>مرتب‌سازی</span>
          </span>
          <span className="course-sort-control">
            <select
              aria-label="مرتب‌سازی دوره‌ها"
              onChange={(event) => { setSort(event.target.value as CourseListQuery["sort"]); setPage(1); }}
              value={sort}
            >
              <option value="newest">جدیدترین</option>
              <option value="popular">محبوب‌ترین</option>
              <option value="price_asc">ارزان‌ترین</option>
              <option value="price_desc">گران‌ترین</option>
            </select>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
              <path d="m7 10 5 5 5-5" />
            </svg>
          </span>
        </label>
      </div>
      {loading && courses.length === 0 ? (
        <div className="empty-state" role="status" aria-live="polite">در حال دریافت دوره‌ها…</div>
      ) : courses.length ? (
        <>
          {loading && <p className="course-refresh-status" role="status" aria-live="polite">در حال به‌روزرسانی نتایج…</p>}
          <div className="course-grid course-grid--listing" aria-busy={loading}>
            {courses.map((course) => <CourseCard course={course} key={course.slug} />)}
          </div>
          {pages > 1 && (
            <nav className="course-pagination" aria-label="صفحه‌های دوره‌ها">
              <button className="button button--outline button--small" disabled={page <= 1} onClick={() => setPage(page - 1)} type="button">قبلی</button>
              <span>صفحه {page.toLocaleString("fa-IR")} از {pages.toLocaleString("fa-IR")}</span>
              <button className="button button--outline button--small" disabled={page >= pages} onClick={() => setPage(page + 1)} type="button">بعدی</button>
            </nav>
          )}
        </>
      ) : (
        <div className="empty-state" role={loadError ? "alert" : "status"}>
          {loadError ? "دوره‌ها بارگیری نشدند." : "دوره‌ای با این مشخصات پیدا نشد."}
        </div>
      )}
    </>
  );
}
