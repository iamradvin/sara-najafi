"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";

type Profile = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
};
type ApiMessage = { message?: string | string[] };

function getErrorMessage(payload: ApiMessage, fallback: string) {
  return Array.isArray(payload.message) ? payload.message.join("، ") : payload.message ?? fallback;
}

export function StudentProfileForm() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    void fetch(apiUrl("/auth/profile"), {
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json()) as Profile & ApiMessage;
        if (!response.ok) throw new Error(getErrorMessage(payload, "دریافت پروفایل انجام نشد."));
        if (controller.signal.aborted) return;
        setProfile(payload);
        setName(payload.name);
        setBio(payload.bio ?? "");
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "دریافت پروفایل انجام نشد.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(apiUrl("/auth/profile"), {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio }),
      });
      const payload = (await response.json()) as Profile & ApiMessage;
      if (!response.ok) throw new Error(getErrorMessage(payload, "ذخیره پروفایل انجام نشد."));
      setProfile(payload);
      setName(payload.name);
      setBio(payload.bio ?? "");
      window.dispatchEvent(new CustomEvent("attractory:profile-updated", { detail: { name: payload.name } }));
      setNotice("تغییرات پروفایل ذخیره شد.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "ذخیره پروفایل انجام نشد.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="dashboard-empty" role="status">در حال دریافت پروفایل…</div>;
  if (!profile) {
    return <div className="dashboard-data-error" role="alert"><p>{error || "پروفایل در دسترس نیست."}</p></div>;
  }

  return (
    <div className="admin-course-manager">
      {error && <p className="auth-error" role="alert">{error}</p>}
      {notice && <p className="admin-course-notice" role="status">{notice}</p>}
      <form className="admin-course-form student-profile-form" onSubmit={(event) => void save(event)}>
        <label>نام و نام خانوادگی
          <input autoComplete="name" maxLength={160} minLength={2} onChange={(event) => setName(event.target.value)} required value={name} />
        </label>
        <label>شماره تماس
          <input dir="ltr" readOnly value={profile.phone ?? "ثبت نشده"} />
        </label>
        <label>ایمیل
          <input dir="ltr" readOnly value={profile.email ?? "ثبت نشده"} />
        </label>
        <label className="admin-course-form__wide">درباره من
          <textarea maxLength={2000} onChange={(event) => setBio(event.target.value)} rows={5} value={bio} />
        </label>
        <p className="student-profile-note">شماره تماس برای حفظ امنیت حساب از این صفحه قابل تغییر نیست.</p>
        <div className="admin-course-form__actions">
          <button className="button button--primary button--small" disabled={saving} type="submit">{saving ? "در حال ذخیره…" : "ذخیره تغییرات"}</button>
        </div>
      </form>
    </div>
  );
}
