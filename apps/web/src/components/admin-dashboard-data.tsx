"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardIcon } from "@/components/dashboard-icon";
import { apiUrl } from "@/lib/api";
import { formatTomanAmount } from "@/lib/format-price";
import { formatPersianDate } from "@/lib/persian-calendar";

type ApiMessage = { message?: string | string[] };
type DashboardSummary = {
  isSuperAdmin: boolean;
  totalCourses: number;
  publishedCourses: number;
  activeEnrollments: number;
  activeStudents: number;
  salesToman: number | null;
  paidOrders: number | null;
  pendingOrders: number | null;
};
type AdminCourse = {
  id: string;
  slug: string;
  title: string;
  thumbnailUrl: string | null;
  status: string;
  categories: { category: { name: string } }[];
  _count: { sections: number; enrollments: number };
};
type AdminOrder = {
  id: string;
  orderNumber: string;
  status: "PENDING" | "PAID" | "CANCELLED" | "REFUNDED";
  totalToman: number;
  createdAt: string;
  user: { name: string; phone: string | null; email: string | null };
  items: { courseTitle: string; unitPriceToman: number }[];
};
type Student = { id: string; name: string; email: string | null; phone: string | null };
type Page<T> = { data: T[]; meta: { page: number; pages: number; total: number } };

const orderStatusLabels: Record<AdminOrder["status"], string> = {
  PENDING: "در انتظار پرداخت",
  PAID: "پرداخت‌شده",
  CANCELLED: "لغوشده",
  REFUNDED: "بازپرداخت‌شده",
};
const courseStatusLabels: Record<string, string> = {
  DRAFT: "پیش‌نویس",
  REVIEW: "در حال بازبینی",
  PUBLISHED: "منتشرشده",
  ARCHIVED: "بایگانی‌شده",
};

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(apiUrl(path), {
    credentials: "include",
    cache: "no-store",
    signal,
  });
  const payload = (await response.json()) as T & ApiMessage;
  if (!response.ok) {
    const message = Array.isArray(payload.message) ? payload.message.join("، ") : payload.message;
    throw new Error(message ?? "دریافت اطلاعات انجام نشد.");
  }
  return payload;
}

function DataError({ message, retry }: Readonly<{ message: string; retry: () => void }>) {
  return (
    <div className="dashboard-data-error" role="alert">
      <p>{message}</p>
      <button className="button button--outline button--small" onClick={retry} type="button">تلاش دوباره</button>
    </div>
  );
}

export function AdminDashboardData() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(async () => {
      setLoading(true);
      setError("");
      try {
        const stats = await request<DashboardSummary>("/admin/dashboard", controller.signal);
        const [coursePage, orderPage] = await Promise.all([
          request<Page<AdminCourse>>("/admin/courses?limit=5", controller.signal),
          stats.isSuperAdmin
            ? request<Page<AdminOrder>>("/admin/orders?limit=5", controller.signal)
            : Promise.resolve({ data: [], meta: { page: 1, pages: 0, total: 0 } }),
        ]);
        if (controller.signal.aborted) return;
        setSummary(stats);
        setCourses(coursePage.data);
        setOrders(orderPage.data);
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : "دریافت نمای کلی انجام نشد.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    });
    return () => controller.abort();
  }, [retry]);

  if (error) return <DataError message={error} retry={() => setRetry((count) => count + 1)} />;
  if (loading || !summary) {
    return <div className="dashboard-empty" role="status">در حال دریافت آمار زنده…</div>;
  }

  const stats = summary.isSuperAdmin
    ? [
        { icon: "sales" as const, value: `${formatTomanAmount(summary.salesToman ?? 0)} تومان`, label: "فروش پرداخت‌شده" },
        { icon: "students" as const, value: summary.activeStudents, label: "دانشجوی فعال" },
        { icon: "courses" as const, value: summary.totalCourses, label: "دوره ثبت‌شده" },
        { icon: "orders" as const, value: summary.pendingOrders ?? 0, label: "سفارش در انتظار" },
      ]
    : [
        { icon: "courses" as const, value: summary.totalCourses, label: "دوره‌های من" },
        { icon: "courses" as const, value: summary.publishedCourses, label: "دوره منتشرشده" },
        { icon: "students" as const, value: summary.activeStudents, label: "دانشجوی فعال" },
        { icon: "completed" as const, value: summary.activeEnrollments, label: "دسترسی فعال" },
      ];

  return (
    <>
      <section className="learning-stats admin-stats" aria-label="آمار زنده">
        {stats.map((item) => (
          <article className="learning-stat" key={item.label}>
            <span className="stat-icon"><DashboardIcon name={item.icon} /></span>
            <div><strong>{typeof item.value === "number" ? item.value.toLocaleString("fa-IR") : item.value}</strong><small>{item.label}</small></div>
          </article>
        ))}
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-heading">
          <div><span>از پایگاه داده</span><h2>دوره‌های اخیر</h2></div>
          <Link className="text-link" href="/admin/courses">مدیریت دوره‌ها <span>←</span></Link>
        </div>
        {courses.length ? (
          <div className="admin-course-list">
            {courses.map((course, index) => (
              <article className="admin-course-row" key={course.id}>
                <span className="row-index">{String(index + 1).padStart(2, "0")}</span>
                {course.thumbnailUrl
                  ? <Image src={course.thumbnailUrl} alt="" width={72} height={58} unoptimized />
                  : <span className="admin-course-placeholder" aria-hidden="true">AS</span>}
                <div className="admin-course-info">
                  <strong>{course.title}</strong>
                  <small>{course.categories.map(({ category }) => category.name).join("، ") || "بدون دسته"} · {course._count.enrollments.toLocaleString("fa-IR")} ثبت‌نام</small>
                </div>
                <span className={`status-chip status-chip--${course.status.toLowerCase()}`}>{courseStatusLabels[course.status] ?? course.status}</span>
                <Link className="card-link" href={`/admin/courses`} aria-label={`مدیریت ${course.title}`}>←</Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="dashboard-empty"><strong>هنوز دوره‌ای ثبت نشده است.</strong><Link className="text-link" href="/admin/courses">ساخت دوره <span>←</span></Link></div>
        )}
      </section>

      {summary.isSuperAdmin && (
        <section className="dashboard-section dashboard-section--secondary">
          <div className="dashboard-section-heading">
            <div><span>وضعیت واقعی پرداخت</span><h2>سفارش‌های اخیر</h2></div>
            <Link className="text-link" href="/admin/orders">همه سفارش‌ها <span>←</span></Link>
          </div>
          {orders.length ? <AdminOrderRows orders={orders} /> : <div className="dashboard-empty"><strong>هنوز سفارشی ثبت نشده است.</strong></div>}
        </section>
      )}
    </>
  );
}

function AdminOrderRows({ orders }: Readonly<{ orders: AdminOrder[] }>) {
  return (
    <div className="admin-course-list">
      {orders.map((order) => (
        <article className="admin-course-row" key={order.id}>
          <span className="row-index">↗</span>
          <div className="admin-course-info">
            <strong><bdi dir="ltr">{order.orderNumber}</bdi> · {order.user.name}</strong>
            <small>{order.user.phone ? <bdi dir="ltr">{order.user.phone}</bdi> : order.user.email ?? "بدون اطلاعات تماس"} · {order.items.map((item) => item.courseTitle).join("، ") || "بدون ردیف سفارش"} · {formatPersianDate(order.createdAt)}</small>
          </div>
          <span className={`status-chip status-chip--${order.status.toLowerCase()}`}>{orderStatusLabels[order.status]}</span>
          <strong>{formatTomanAmount(order.totalToman)} تومان</strong>
        </article>
      ))}
    </div>
  );
}

export function AdminStudentsPanel() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() =>
      request<Student[]>("/enrollments/admin/students", controller.signal)
        .then(setStudents)
        .catch((cause: unknown) => {
          if (cause instanceof DOMException && cause.name === "AbortError") return;
          setError(cause instanceof Error ? cause.message : "دریافت فهرست دانشجوها انجام نشد.");
        })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); }),
    );
    return () => controller.abort();
  }, [retry]);

  if (error) return <DataError message={error} retry={() => { setLoading(true); setRetry((count) => count + 1); }} />;
  if (loading) return <div className="dashboard-empty" role="status">در حال دریافت دانشجوها…</div>;
  if (!students.length) return <div className="dashboard-empty"><strong>دانشجویی ثبت نشده است.</strong></div>;

  return (
    <section className="dashboard-section">
      <div className="dashboard-section-heading">
        <div><span>حداکثر ۲۰۰ دانشجوی فعال</span><h2>دانشجوها</h2></div>
        <Link className="text-link" href="/admin/enrollments">مدیریت دسترسی‌ها <span>←</span></Link>
      </div>
      <div className="admin-course-list">
        {students.map((student, index) => (
          <article className="admin-course-row" key={student.id}>
            <span className="row-index">{String(index + 1).padStart(2, "0")}</span>
            <div className="admin-course-info">
              <strong>{student.name}</strong>
              <small>{student.phone ? <bdi dir="ltr">{student.phone}</bdi> : student.email ?? "اطلاعات تماس ثبت نشده است"}</small>
            </div>
            <span className="status-chip">فعال</span>
          </article>
        ))}
      </div>
    </section>
  );
}

export function AdminOrdersPanel() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(async () => {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (status) params.set("status", status);
      try {
        const result = await request<Page<AdminOrder>>(`/admin/orders?${params}`, controller.signal);
        if (controller.signal.aborted) return;
        setOrders(result.data);
        setPages(result.meta.pages);
        setTotal(result.meta.total);
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "دریافت سفارش‌ها انجام نشد.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    });
    return () => controller.abort();
  }, [page, retry, status]);

  if (error) return <DataError message={error} retry={() => setRetry((count) => count + 1)} />;

  return (
    <section className="dashboard-section">
      <div className="dashboard-section-heading">
        <div><span>{total.toLocaleString("fa-IR")} سفارش</span><h2>گزارش سفارش‌ها</h2></div>
        <label className="admin-order-filter">وضعیت
          <select onChange={(event) => { setStatus(event.target.value); setPage(1); }} value={status}>
            <option value="">همه</option>
            <option value="PENDING">در انتظار پرداخت</option>
            <option value="PAID">پرداخت‌شده</option>
            <option value="CANCELLED">لغوشده</option>
            <option value="REFUNDED">بازپرداخت‌شده</option>
          </select>
        </label>
      </div>
      {loading ? <div className="dashboard-empty" role="status">در حال دریافت سفارش‌ها…</div> : orders.length ? (
        <>
          <AdminOrderRows orders={orders} />
          <div className="admin-pagination" aria-label="صفحه‌بندی سفارش‌ها">
            <button className="button button--outline button--small" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} type="button">قبلی</button>
            <span>صفحه {page.toLocaleString("fa-IR")} از {pages.toLocaleString("fa-IR")}</span>
            <button className="button button--outline button--small" disabled={page >= pages || loading} onClick={() => setPage((value) => value + 1)} type="button">بعدی</button>
          </div>
        </>
      ) : <div className="dashboard-empty"><strong>سفارشی با این وضعیت پیدا نشد.</strong></div>}
    </section>
  );
}
