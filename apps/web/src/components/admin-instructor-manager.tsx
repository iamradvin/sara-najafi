"use client";

import { useCallback, useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";

type Instructor = { id: string; name: string; email: string | null; bio: string | null };
type Student = { id: string; name: string; email: string | null; phone: string | null };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const payload = (await response.json()) as T & { message?: string | string[] };
  if (!response.ok) throw new Error(Array.isArray(payload.message) ? payload.message.join("، ") : payload.message ?? "درخواست انجام نشد.");
  return payload;
}

export function AdminInstructorManager() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [userId, setUserId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    const [activeInstructors, eligibleUsers] = await Promise.all([
      request<Instructor[]>("/admin/instructors"),
      request<Student[]>("/enrollments/admin/students"),
    ]);
    const existing = new Set(activeInstructors.map(({ id }) => id));
    return {
      instructors: activeInstructors,
      students: eligibleUsers.filter(({ id }) => !existing.has(id)),
    };
  }, []);
  const refresh = useCallback(async () => {
    const result = await load();
    setInstructors(result.instructors);
    setStudents(result.students);
  }, [load]);

  useEffect(() => {
    let active = true;
    load()
      .then((result) => {
        if (!active) return;
        setInstructors(result.instructors);
        setStudents(result.students);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "دریافت مدرسان انجام نشد.");
      });
    return () => { active = false; };
  }, [load]);

  async function assign() {
    setBusy(true);
    setError("");
    try {
      await request(`/admin/instructors/${userId}`, { method: "POST" });
      setUserId("");
      setNotice("نقش مدرس به کاربر داده شد.");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تخصیص نقش مدرس انجام نشد.");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(instructor: Instructor) {
    if (!window.confirm(`نقش مدرس ${instructor.name} لغو شود؟`)) return;
    setBusy(true);
    setError("");
    try {
      await request(`/admin/instructors/${instructor.id}`, { method: "DELETE" });
      setNotice("نقش مدرس لغو شد.");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "لغو نقش مدرس انجام نشد.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-course-manager">
      <section className="dashboard-section">
        <div className="dashboard-section-heading"><div><span>مدیریت دسترسی</span><h2>افزودن مدرس</h2></div></div>
        <div className="admin-course-form">
          <label>دانشجو<select onChange={(event) => setUserId(event.target.value)} value={userId}><option value="">انتخاب کاربر</option>{students.map((student) => <option key={student.id} value={student.id}>{student.name}{student.email ? ` · ${student.email}` : student.phone ? ` · ${student.phone}` : ""}</option>)}</select></label>
          <div className="admin-course-form__actions"><button className="button button--primary button--small" disabled={busy || !userId} onClick={() => void assign()} type="button">دادن نقش مدرس</button></div>
        </div>
      </section>
      {error && <p className="auth-error" role="alert">{error}</p>}
      {notice && <p className="admin-course-notice" role="status">{notice}</p>}
      <section className="dashboard-section">
        <div className="dashboard-section-heading"><div><span>کاربران مجاز</span><h2>مدرسان</h2></div></div>
        <div className="admin-course-list">
          {instructors.map((instructor) => (
            <article className="admin-course-row" key={instructor.id}>
              <div className="admin-course-info"><strong>{instructor.name}</strong><small>{instructor.email ?? "بدون ایمیل"} · <bdi dir="ltr">{instructor.id}</bdi></small></div>
              <button className="text-link" disabled={busy} onClick={() => void revoke(instructor)} type="button">لغو نقش</button>
            </article>
          ))}
          {!instructors.length && <div className="dashboard-empty">مدرسی تعریف نشده است.</div>}
        </div>
      </section>
    </div>
  );
}
