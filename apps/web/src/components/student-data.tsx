"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { DashboardIcon } from "@/components/dashboard-icon";
import { apiUrl } from "@/lib/api";
import {
  getBrandCourseCategoryLabel,
  getBrandCourseLessonTitle,
  getBrandCourseTitle,
  getBrandCourseTitleFromStoredTitle,
} from "@/lib/courses";
import { formatTomanAmount } from "@/lib/format-price";
import { formatPersianDate } from "@/lib/persian-calendar";

type StudentCourse = {
  id: string;
  enrolledAt: string;
  course: {
    id: string;
    slug: string;
    title: string;
    thumbnailUrl: string | null;
    category: string;
  };
  lessons: {
    id: string;
    title: string;
    durationSec: number;
    videoReady: boolean;
    isComplete: boolean;
  }[];
  totalLessons: number;
  completedLessons: number;
  watchedSeconds: number;
  lastLessonId: string | null;
  lastAccessedAt: string | null;
  progressPercent: number;
};

type StudentOrder = {
  orderNumber: string;
  status: "PENDING" | "PAID" | "CANCELLED" | "REFUNDED";
  totalToman: number;
  createdAt: string;
  items: { courseTitle: string; unitPriceToman: number }[];
};

type ApiMessage = { message?: string | string[] };

function getErrorMessage(payload: ApiMessage, fallback: string): string {
  if (Array.isArray(payload.message)) return payload.message[0] ?? fallback;
  return payload.message ?? fallback;
}

async function loadData<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(apiUrl(path), {
    credentials: "include",
    cache: "no-store",
    signal,
  });
  const payload = (await response.json()) as T & ApiMessage;
  if (!response.ok) throw new Error(getErrorMessage(payload, "دریافت اطلاعات انجام نشد."));
  return payload;
}

function CourseRows({ courses }: Readonly<{ courses: StudentCourse[] }>) {
  return (
    <div className="learning-list">
      {courses.map((item) => {
        return (
        <article className="learning-course" key={item.id}>
          <div className="learning-course-placeholder" aria-hidden="true">
            <span>SN</span><strong>{getBrandCourseTitle(item.course.slug)}</strong>
          </div>
          <div className="learning-course-info">
            <span className="course-category">{getBrandCourseCategoryLabel(item.course.slug)}</span>
            <h3><Link href={`/student/courses/${item.course.id}`}>{getBrandCourseTitle(item.course.slug)}</Link></h3>
            <div
              aria-label="میزان پیشرفت دوره"
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={item.progressPercent}
              className="progress-track"
              role="progressbar"
            >
              <span style={{ width: `${item.progressPercent}%` }} />
            </div>
            <details className="student-course-lessons">
              <summary>جلسه‌های دوره <span>{item.lessons.length.toLocaleString("fa-IR")}</span></summary>
              {item.lessons.length ? (
                <ul>
                  {item.lessons.map((lesson, index) => (
                    <li key={lesson.id}>
                      {lesson.videoReady ? (
                        <Link href={`/student/lessons/${lesson.id}`}>{getBrandCourseLessonTitle(item.course.slug, index)} <span>پخش امن ←</span></Link>
                      ) : (
                        <span className="student-lesson-unavailable">{getBrandCourseLessonTitle(item.course.slug, index)} <small>پخش امن هنوز تنظیم نشده</small></span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>جلسه‌ای برای این دوره ثبت نشده است.</p>
              )}
            </details>
          </div>
          <strong className="progress-value">{item.progressPercent.toLocaleString("fa-IR")}٪</strong>
          <Link
            aria-label={`ادامه دوره ${getBrandCourseTitle(item.course.slug)}`}
            className="card-link"
            href={`/student/courses/${item.course.id}`}
          >
            ←
          </Link>
        </article>
        );
      })}
    </div>
  );
}

export function StudentDashboardData() {
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const load = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    setError("");
    try {
      setCourses(await loadData<StudentCourse[]>("/student/courses", signal));
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setError(cause instanceof Error ? cause.message : "ارتباط با سرور برقرار نشد.");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => load(controller.signal));
    return () => controller.abort();
  }, [load, retryCount]);

  const completedLessons = courses.reduce((total, item) => total + item.completedLessons, 0);
  const watchedSeconds = courses.reduce((total, item) => total + item.watchedSeconds, 0);
  const watchedMinutes = Math.floor(watchedSeconds / 60);
  const watchedHours = Math.floor(watchedMinutes / 60);
  const remainingMinutes = watchedMinutes % 60;
  const watchedTime = `${watchedHours.toLocaleString("fa-IR")}٫${remainingMinutes.toLocaleString("fa-IR", { minimumIntegerDigits: 2 })}`;
  const recentCourse = courses.reduce<StudentCourse | null>((latest, item) => {
    if (!item.lastAccessedAt) return latest;
    return !latest || !latest.lastAccessedAt || item.lastAccessedAt > latest.lastAccessedAt ? item : latest;
  }, null);

  return (
    <>
      {error && (
        <div className="dashboard-data-error" role="alert">
          <p>{error}</p>
          <button className="button button--outline button--small" onClick={() => setRetryCount((count) => count + 1)} type="button">تلاش دوباره</button>
        </div>
      )}
      <section className="learning-stats" aria-label="خلاصه یادگیری">
        <article className="learning-stat"><span className="stat-icon"><DashboardIcon name="courses" /></span><div><strong>{courses.length.toLocaleString("fa-IR", { minimumIntegerDigits: 2 })}</strong><small>دوره در مسیر</small></div></article>
        <article className="learning-stat"><span className="stat-icon"><DashboardIcon name="learning-time" /></span><div><strong>{watchedTime}</strong><small>ساعت یادگیری</small></div></article>
        <article className="learning-stat"><span className="stat-icon"><DashboardIcon name="completed" /></span><div><strong>{completedLessons.toLocaleString("fa-IR")}</strong><small>جلسه تکمیل‌شده</small></div></article>
      </section>
      <section className="dashboard-section">
        <div className="dashboard-section-heading">
          <div><span>ادامه مسیرت</span><h2>یادگیری تو</h2></div>
          <Link className="text-link" href="/student/courses">نمایش همه <span>←</span></Link>
        </div>
        {loading ? <div className="dashboard-empty" role="status">در حال دریافت دوره‌ها…</div> : courses.length ? (
          <CourseRows courses={courses.slice(0, 3)} />
        ) : !error ? (
          <div className="dashboard-empty">
            <strong>هنوز به دوره‌ای دسترسی نداری</strong>
            <p>پس از ثبت‌نام یا خرید، دوره‌ها در این بخش نمایش داده می‌شوند.</p>
            <Link className="text-link" href="/courses">دیدن دوره‌ها ←</Link>
          </div>
        ) : null}
      </section>
      <section className="dashboard-section dashboard-section--secondary">
        <div className="dashboard-section-heading"><div><span>برای پیگیری</span><h2>فعالیت اخیر</h2></div></div>
        <div className="activity-card">
          <span className="activity-mark">{recentCourse ? "↗" : "✳"}</span>
          <div><strong>{recentCourse ? `آخرین مسیر: ${getBrandCourseTitle(recentCourse.course.slug)}` : "هنوز فعالیتی ثبت نشده است"}</strong><small>{recentCourse?.lastAccessedAt ? `آخرین مشاهده در ${formatPersianDate(recentCourse.lastAccessedAt)} · پیشرفت ${recentCourse.progressPercent.toLocaleString("fa-IR")}٪` : "با شروع یک جلسه، آخرین فعالیت و میزان پیشرفتت اینجا نمایش داده می‌شود."}</small></div>
          <Link className="button button--outline button--small" href={recentCourse ? `/student/courses/${recentCourse.course.id}` : courses.length ? "/student/courses" : "/courses"}>
            {recentCourse ? "ادامه یادگیری" : courses.length ? "دوره‌های من" : "انتخاب دوره"}
          </Link>
        </div>
      </section>
    </>
  );
}

export function StudentCoursesPanel() {
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() =>
      loadData<StudentCourse[]>("/student/courses", controller.signal)
        .then(setCourses)
        .catch((cause: unknown) => {
          if (cause instanceof DOMException && cause.name === "AbortError") return;
          setError(cause instanceof Error ? cause.message : "ارتباط با سرور برقرار نشد.");
        })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); }),
    );
    return () => controller.abort();
  }, [retryCount]);

  if (error) return (
    <div className="dashboard-data-error" role="alert">
      <p>{error}</p>
      <button
        className="button button--outline button--small"
        onClick={() => {
          setLoading(true);
          setError("");
          setRetryCount((count) => count + 1);
        }}
        type="button"
      >
        تلاش دوباره
      </button>
    </div>
  );
  if (loading) return <div className="dashboard-empty" role="status">در حال دریافت دوره‌ها…</div>;
  if (!courses.length) {
    return (
      <div className="dashboard-empty">
        <strong>هنوز به دوره‌ای دسترسی نداری</strong>
        <p>پس از ثبت‌نام یا خرید، دوره‌ها در این بخش نمایش داده می‌شوند.</p>
        <Link className="text-link" href="/courses">دیدن دوره‌ها ←</Link>
      </div>
    );
  }
  return <CourseRows courses={courses} />;
}

const orderStatusLabels: Record<StudentOrder["status"], string> = {
  PENDING: "در انتظار پرداخت",
  PAID: "پرداخت‌شده",
  CANCELLED: "لغوشده",
  REFUNDED: "بازپرداخت‌شده",
};

export function StudentOrdersPanel() {
  const [orders, setOrders] = useState<StudentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() =>
      loadData<StudentOrder[]>("/student/orders", controller.signal)
        .then(setOrders)
        .catch((cause: unknown) => {
          if (cause instanceof DOMException && cause.name === "AbortError") return;
          setError(cause instanceof Error ? cause.message : "ارتباط با سرور برقرار نشد.");
        })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); }),
    );
    return () => controller.abort();
  }, [retryCount]);

  if (error) return (
    <div className="dashboard-data-error" role="alert">
      <p>{error}</p>
      <button
        className="button button--outline button--small"
        onClick={() => {
          setLoading(true);
          setError("");
          setRetryCount((count) => count + 1);
        }}
        type="button"
      >
        تلاش دوباره
      </button>
    </div>
  );
  if (loading) return <div className="dashboard-empty" role="status">در حال دریافت سفارش‌ها…</div>;
  if (!orders.length) {
    return (
      <div className="dashboard-empty">
        <strong>هنوز سفارشی ثبت نکرده‌ای</strong>
        <p>پس از ثبت سفارش، وضعیت و جزئیات آن در این بخش نمایش داده می‌شود.</p>
        <Link className="text-link" href="/courses">دیدن دوره‌ها ←</Link>
      </div>
    );
  }
  return (
    <div className="admin-course-list student-order-list">
      {orders.map((order) => (
        <article className="admin-course-row" key={order.orderNumber}>
          <span className="row-index">↗</span>
          <div className="admin-course-info">
            <strong><bdi dir="ltr">{order.orderNumber}</bdi></strong>
            <small>{order.items.map((item) => getBrandCourseTitleFromStoredTitle(item.courseTitle)).join("، ") || "بدون ردیف سفارش"}</small>
          </div>
          <span className={`status-chip status-chip--${order.status.toLowerCase()}`}>{orderStatusLabels[order.status]}</span>
          <strong>{formatTomanAmount(order.totalToman)} تومان</strong>
          <time dateTime={order.createdAt}>{formatPersianDate(order.createdAt)}</time>
        </article>
      ))}
    </div>
  );
}
