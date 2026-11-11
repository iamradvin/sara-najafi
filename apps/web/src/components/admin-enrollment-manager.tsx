"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";
import { PersianDateTimePicker } from "@/components/persian-date-time-picker";

type Student = { id: string; name: string; email: string | null; phone: string | null };
type Course = { id: string; title: string };
type Enrollment = {
  id: string;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
  source: "FREE" | "MANUAL" | "PAYMENT";
  enrolledAt: string;
  expiresAt: string | null;
  user: { id: string; name: string; email: string | null; phone: string | null };
  course: { id: string; slug: string; title: string };
  history: { id: string; status: string; source: string; reason: string | null; createdAt: string }[];
};
type Page<T> = { data: T[]; meta: { page: number; pages: number; total: number } };

const enrollmentStatusLabels: Record<Enrollment["status"], string> = {
  ACTIVE: "فعال",
  EXPIRED: "منقضی‌شده",
  REVOKED: "لغوشده",
};
const enrollmentSourceLabels: Record<Enrollment["source"], string> = {
  FREE: "رایگان",
  MANUAL: "دستی",
  PAYMENT: "پرداخت",
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const payload = (await response.json()) as T & { message?: string | string[] };
  if (!response.ok) {
    throw new Error(Array.isArray(payload.message) ? payload.message.join("، ") : payload.message ?? "درخواست انجام نشد.");
  }
  return payload;
}

export function AdminEnrollmentManager() {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [studentId, setStudentId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    const [studentList, courseList, enrollmentPage] = await Promise.all([
      request<Student[]>("/enrollments/admin/students"),
      request<Course[]>("/enrollments/admin/courses"),
      request<Page<Enrollment>>("/enrollments?limit=100"),
    ]);
    return { students: studentList, courses: courseList, enrollments: enrollmentPage.data };
  }, []);
  const refresh = useCallback(async () => {
    const result = await load();
    setStudents(result.students);
    setCourses(result.courses);
    setEnrollments(result.enrollments);
  }, [load]);

  useEffect(() => {
    let active = true;
    load()
      .then((result) => {
        if (!active) return;
        setStudents(result.students);
        setCourses(result.courses);
        setEnrollments(result.enrollments);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "دریافت ثبت‌نام‌ها انجام نشد.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [load]);

  async function enroll(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await request("/enrollments/manual", {
        method: "POST",
        body: JSON.stringify({
          userId: studentId,
          courseId,
          expiresAt: expiresAt || null,
          reason: reason || undefined,
        }),
      });
      setNotice("دسترسی دانشجو ثبت شد.");
      setExpiresAt("");
      setReason("");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "ثبت دسترسی انجام نشد.");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(enrollment: Enrollment) {
    if (!window.confirm(`دسترسی ${enrollment.user.name} به «${enrollment.course.title}» لغو شود؟`)) return;
    setBusy(true);
    setError("");
    try {
      await request(`/enrollments/${enrollment.id}/revoke`, {
        method: "POST",
        body: JSON.stringify({ reason: "لغو از پنل مدیریت" }),
      });
      setNotice("دسترسی لغو شد و در تاریخچه ثبت شد.");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "لغو دسترسی انجام نشد.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-course-manager">
      <section className="dashboard-section">
        <div className="dashboard-section-heading"><div><span>مدیریت دسترسی</span><h2>ثبت‌نام دستی دانشجو</h2></div></div>
        <form className="admin-course-form" onSubmit={(event) => void enroll(event)}>
          <label>دانشجو<select onChange={(event) => setStudentId(event.target.value)} required value={studentId}><option value="">انتخاب دانشجو</option>{students.map((student) => <option key={student.id} value={student.id}>{student.name}{student.email ? ` · ${student.email}` : student.phone ? ` · ${student.phone}` : ""}</option>)}</select></label>
          <label>دوره<select onChange={(event) => setCourseId(event.target.value)} required value={courseId}><option value="">انتخاب دوره</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
          <div aria-labelledby="enrollment-expiration-label" className="admin-course-form__date-field" role="group">
            <span id="enrollment-expiration-label">انقضای دسترسی (اختیاری)</span>
            <PersianDateTimePicker onChange={setExpiresAt} value={expiresAt} />
          </div>
          <label>دلیل ثبت<input maxLength={500} onChange={(event) => setReason(event.target.value)} value={reason} /></label>
          <div className="admin-course-form__actions"><button className="button button--primary button--small" disabled={busy || !students.length || !courses.length} type="submit">{busy ? "در حال ثبت…" : "اعطای دسترسی"}</button></div>
        </form>
      </section>
      {error && <p className="auth-error" role="alert">{error}</p>}
      {notice && <p className="admin-course-notice" role="status">{notice}</p>}
      <section className="dashboard-section">
        <div className="dashboard-section-heading"><div><span>سوابق دسترسی</span><h2>ثبت‌نام دانشجوها</h2></div><button className="text-link" disabled={loading} onClick={() => void refresh()} type="button">تازه‌سازی ↻</button></div>
        {loading ? <div className="dashboard-empty" role="status">در حال بارگذاری…</div> : enrollments.length ? (
          <div className="admin-course-list">
            {enrollments.map((enrollment) => (
              <article className="admin-course-row" key={enrollment.id}>
                <div className="admin-course-info"><strong>{enrollment.user.name} · {enrollment.course.title}</strong><small>{enrollment.user.email ?? enrollment.user.phone ?? "بدون راه ارتباطی"} · {enrollmentSourceLabels[enrollment.source]} · {enrollment.history.length.toLocaleString("fa-IR")} رویداد</small></div>
                <span className={`status-chip status-chip--${enrollment.status.toLowerCase()}`}>{enrollmentStatusLabels[enrollment.status]}</span>
                {enrollment.status !== "REVOKED" && <button className="text-link" disabled={busy} onClick={() => void revoke(enrollment)} type="button">لغو دسترسی</button>}
              </article>
            ))}
          </div>
        ) : <div className="dashboard-empty">ثبت‌نامی وجود ندارد.</div>}
      </section>
    </div>
  );
}
