"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";
import { slugFromText } from "@/lib/slug";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count: { courses: number };
};
type Values = { name: string; slug: string; description: string };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const payload = (await response.json()) as T & { message?: string | string[] };
  if (!response.ok) {
    throw new Error(Array.isArray(payload.message) ? payload.message.join("، ") : payload.message ?? "درخواست انجام نشد.");
  }
  return payload;
}

export function AdminCategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [values, setValues] = useState<Values>({ name: "", slug: "", description: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => request<Category[]>("/categories/admin"), []);

  useEffect(() => {
    let active = true;
    load()
      .then((items) => { if (active) setCategories(items); })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "دسته‌بندی‌ها دریافت نشدند.");
      });
    return () => { active = false; };
  }, [load]);

  function setName(name: string) {
    setValues((current) => ({
      ...current,
      name,
      ...(editingId ? {} : { slug: slugFromText(name) }),
    }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await request<Category>(editingId ? `/categories/${editingId}` : "/categories", {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify({
          name: values.name,
          slug: values.slug,
          description: values.description || null,
        }),
      });
      setValues({ name: "", slug: "", description: "" });
      setEditingId(null);
      setNotice("دسته‌بندی ذخیره شد.");
      setCategories(await load());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "ذخیره دسته‌بندی انجام نشد.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(category: Category) {
    if (!window.confirm(`دسته‌بندی «${category.name}» حذف شود؟`)) return;
    setBusy(true);
    setError("");
    try {
      await request(`/categories/${category.id}`, { method: "DELETE" });
      setNotice("دسته‌بندی حذف شد.");
      setCategories(await load());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "حذف دسته‌بندی انجام نشد.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-course-manager">
      <section className="dashboard-section">
        <div className="dashboard-section-heading">
          <div><span>مدیریت محتوا</span><h2>{editingId ? "ویرایش دسته‌بندی" : "افزودن دسته‌بندی"}</h2></div>
        </div>
        <form className="admin-course-form" onSubmit={save}>
          <label>نام دسته‌بندی<input maxLength={120} onChange={(event) => setName(event.target.value)} required value={values.name} /></label>
          <label>نشانی<input dir="ltr" maxLength={140} onChange={(event) => setValues((current) => ({ ...current, slug: event.target.value }))} required value={values.slug} /></label>
          <label className="admin-course-form__wide">توضیحات<textarea maxLength={2000} onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))} rows={2} value={values.description} /></label>
          <div className="admin-course-form__actions">
            <button className="button button--primary button--small" disabled={busy || !values.slug} type="submit">{busy ? "در حال ذخیره…" : editingId ? "ذخیره تغییرات" : "ایجاد دسته‌بندی"}</button>
            {editingId && <button className="button button--outline button--small" onClick={() => { setEditingId(null); setValues({ name: "", slug: "", description: "" }); }} type="button">لغو</button>}
          </div>
        </form>
      </section>
      {error && <p className="auth-error" role="alert">{error}</p>}
      {notice && <p className="admin-course-notice" role="status">{notice}</p>}
      <section className="dashboard-section">
        <div className="dashboard-section-heading"><div><span>طبقه‌بندی</span><h2>دسته‌بندی‌ها</h2></div></div>
        <div className="admin-course-list">
          {categories.map((category) => (
            <article className="admin-course-row" key={category.id}>
              <div className="admin-course-info"><strong>{category.name}</strong><small dir="ltr">{category.slug} · {category._count.courses} دوره</small></div>
              <div className="admin-course-actions">
                <button className="text-link" disabled={busy} onClick={() => { setEditingId(category.id); setValues({ name: category.name, slug: category.slug, description: category.description ?? "" }); }} type="button">ویرایش</button>
                <button className="text-link" disabled={busy || category._count.courses > 0} onClick={() => void remove(category)} type="button">حذف</button>
              </div>
            </article>
          ))}
          {!categories.length && <div className="dashboard-empty">هنوز دسته‌بندی‌ای ثبت نشده است.</div>}
        </div>
      </section>
    </div>
  );
}
