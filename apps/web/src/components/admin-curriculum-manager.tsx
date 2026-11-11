"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";

type AdminLesson = {
  id: string;
  title: string;
  description: string | null;
  videoKey: string | null;
  durationSec: number;
  isPreview: boolean;
  isPublished: boolean;
  position: number;
  _count?: { progress: number };
  resources: { id: string; title: string; url: string; fileName: string | null }[];
};
type AdminSection = {
  id: string;
  title: string;
  position: number;
  lessons: AdminLesson[];
};
type LessonValues = {
  title: string;
  description: string;
  videoKey: string;
  durationSec: string;
  isPreview: boolean;
  isPublished: boolean;
};

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : "درخواست انجام نشد.";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const payload = (await response.json()) as T & { message?: string | string[] };
  if (!response.ok) {
    const message = payload.message;
    throw new Error(Array.isArray(message) ? message.join("، ") : message ?? "درخواست انجام نشد.");
  }
  return payload;
}

function toLessonValues(lesson?: AdminLesson): LessonValues {
  return {
    title: lesson?.title ?? "",
    description: lesson?.description ?? "",
    videoKey: lesson?.videoKey ?? "",
    durationSec: String(lesson?.durationSec ?? 0),
    isPreview: lesson?.isPreview ?? false,
    isPublished: lesson?.isPublished ?? true,
  };
}

function AdminLessonRow({
  courseId,
  sectionId,
  lesson,
  onChange,
  onError,
}: Readonly<{
  courseId: string;
  sectionId: string;
  lesson: AdminLesson;
  onChange: () => void;
  onError: (message: string) => void;
}>) {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState(() => toLessonValues(lesson));
  const [busy, setBusy] = useState(false);
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");

  function update<K extends keyof LessonValues>(key: K, value: LessonValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    onError("");
    try {
      await request<AdminLesson>(
        `/modules/course/${courseId}/${sectionId}/lessons/${lesson.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            title: values.title,
            description: values.description || null,
            videoKey: values.videoKey || null,
            durationSec: Number(values.durationSec),
            isPreview: values.isPreview,
            isPublished: values.isPublished,
          }),
        },
      );
      setEditing(false);
      onChange();
    } catch (error) {
      onError(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  function startEditing() {
    setValues(toLessonValues(lesson));
    setEditing(true);
  }

  async function remove() {
    if (!window.confirm(`جلسه «${lesson.title}» حذف شود؟`)) return;
    setBusy(true);
    onError("");
    try {
      await request<{ deleted: boolean }>(
        `/modules/course/${courseId}/${sectionId}/lessons/${lesson.id}`,
        { method: "DELETE" },
      );
      onChange();
    } catch (error) {
      onError(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  async function addResource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    onError("");
    try {
      await request(
        `/modules/course/${courseId}/${sectionId}/lessons/${lesson.id}/resources`,
        {
          method: "POST",
          body: JSON.stringify({ title: resourceTitle, url: resourceUrl }),
        },
      );
      setResourceTitle("");
      setResourceUrl("");
      onChange();
    } catch (error) {
      onError(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  async function removeResource(resourceId: string) {
    setBusy(true);
    onError("");
    try {
      await request(
        `/modules/course/${courseId}/${sectionId}/lessons/${lesson.id}/resources/${resourceId}`,
        { method: "DELETE" },
      );
      onChange();
    } catch (error) {
      onError(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  if (!editing) {
    return (
      <article className="curriculum-admin-lesson">
        <div>
          <strong>{lesson.title}</strong>
          <small>
            {lesson.durationSec ? `${Math.ceil(lesson.durationSec / 60)} دقیقه` : "مدت نامشخص"}
            {lesson.isPreview ? " · پیش‌نمایش عمومی" : " · فقط دانشجو"}
            {lesson.isPublished ? " · منتشرشده" : " · پیش‌نویس"}
            {lesson.videoKey ? " · شناسه فایل ثبت شده" : " · بدون فایل متصل"}
          </small>
        </div>
        <div className="admin-course-actions">
          <button className="text-link" disabled={busy} onClick={startEditing} type="button">ویرایش</button>
          <button className="text-link" disabled={busy} onClick={() => void remove()} type="button">حذف</button>
        </div>
        {lesson.resources.length > 0 && (
          <ul className="curriculum-admin-resources">
            {lesson.resources.map((resource) => (
              <li key={resource.id}>
                <a href={resource.url} rel="noreferrer" target="_blank">{resource.title}</a>
                <button className="text-link" disabled={busy} onClick={() => void removeResource(resource.id)} type="button">حذف منبع</button>
              </li>
            ))}
          </ul>
        )}
        <form className="admin-course-form curriculum-admin-resource-form" onSubmit={(event) => void addResource(event)}>
          <label>عنوان منبع<input maxLength={180} onChange={(event) => setResourceTitle(event.target.value)} required value={resourceTitle} /></label>
          <label>نشانی HTTPS یا فایل بارگذاری‌شده<input dir="ltr" maxLength={1000} onChange={(event) => setResourceUrl(event.target.value)} required value={resourceUrl} /></label>
          <button className="button button--outline button--small" disabled={busy} type="submit">افزودن فایل کمکی</button>
        </form>
      </article>
    );
  }

  return (
    <form className="admin-course-form curriculum-admin-lesson-form" onSubmit={save}>
      <label>
        عنوان جلسه
        <input maxLength={180} onChange={(event) => update("title", event.target.value)} required value={values.title} />
      </label>
      <label>
        مدت (ثانیه)
        <input min="0" onChange={(event) => update("durationSec", event.target.value)} type="number" value={values.durationSec} />
      </label>
      <label className="admin-course-form__wide">
        توضیحات جلسه
        <textarea maxLength={10000} onChange={(event) => update("description", event.target.value)} rows={2} value={values.description} />
      </label>
      <label className="admin-course-form__wide">
        شناسه ویدیو در VdoCipher (نه نشانی اینترنتی)
        <input dir="ltr" maxLength={120} onChange={(event) => update("videoKey", event.target.value)} placeholder="شناسه ویدیوی بارگذاری‌شده در VdoCipher" value={values.videoKey} />
      </label>
      <label className="admin-course-free-option">
        <input checked={values.isPreview} onChange={(event) => update("isPreview", event.target.checked)} type="checkbox" />
        پیش‌نمایش رایگان
      </label>
      <label className="admin-course-free-option">
        <input checked={values.isPublished} onChange={(event) => update("isPublished", event.target.checked)} type="checkbox" />
        جلسه منتشرشده
      </label>
      <div className="admin-course-form__actions">
        <button className="button button--primary button--small" disabled={busy} type="submit">{busy ? "در حال ذخیره…" : "ذخیره جلسه"}</button>
        <button className="button button--outline button--small" disabled={busy} onClick={() => { setValues(toLessonValues(lesson)); setEditing(false); }} type="button">لغو</button>
      </div>
    </form>
  );
}

export function AdminCurriculumManager({ courseId, courseTitle }: Readonly<{ courseId: string; courseTitle: string }>) {
  const [sections, setSections] = useState<AdminSection[]>([]);
  const [sectionTitle, setSectionTitle] = useState("");
  const [newLessons, setNewLessons] = useState<Record<string, LessonValues>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const basePath = `/modules/course/${courseId}`;
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setSections(await request<AdminSection[]>(basePath));
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setLoading(false);
    }
  }, [basePath]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  async function addSection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await request<AdminSection>(basePath, {
        method: "POST",
        body: JSON.stringify({ title: sectionTitle }),
      });
      setSectionTitle("");
      setNotice("فصل جدید اضافه شد.");
      await load();
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setSaving(false);
    }
  }

  async function editSection(section: AdminSection) {
    const title = window.prompt("عنوان فصل", section.title)?.trim();
    if (!title || title === section.title) return;
    setError("");
    try {
      await request<AdminSection>(`${basePath}/${section.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title }),
      });
      await load();
    } catch (cause) {
      setError(errorText(cause));
    }
  }

  async function deleteSection(section: AdminSection) {
    if (!window.confirm(`فصل «${section.title}» و جلسات آن حذف شود؟`)) return;
    setError("");
    try {
      await request<{ deleted: boolean }>(`${basePath}/${section.id}`, { method: "DELETE" });
      setNotice("فصل حذف شد.");
      await load();
    } catch (cause) {
      setError(errorText(cause));
    }
  }

  async function reorderSections(from: number, to: number) {
    if (to < 0 || to >= sections.length) return;
    const next = [...sections];
    [next[from], next[to]] = [next[to], next[from]];
    setError("");
    try {
      await request<AdminSection[]>(`${basePath}/reorder`, {
        method: "PUT",
        body: JSON.stringify({ sectionIds: next.map((section) => section.id) }),
      });
      await load();
    } catch (cause) {
      setError(errorText(cause));
    }
  }

  async function addLesson(event: FormEvent<HTMLFormElement>, sectionId: string) {
    event.preventDefault();
    const values = newLessons[sectionId] ?? toLessonValues();
    setSaving(true);
    setError("");
    try {
      await request<AdminLesson>(`${basePath}/${sectionId}/lessons`, {
        method: "POST",
        body: JSON.stringify({
          title: values.title,
          description: values.description || null,
          videoKey: values.videoKey || null,
          durationSec: Number(values.durationSec),
          isPreview: values.isPreview,
          isPublished: values.isPublished,
        }),
      });
      setNewLessons((current) => ({ ...current, [sectionId]: toLessonValues() }));
      setNotice("جلسه جدید اضافه شد.");
      await load();
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setSaving(false);
    }
  }

  async function reorderLessons(section: AdminSection, from: number, to: number) {
    if (to < 0 || to >= section.lessons.length) return;
    const lessons = [...section.lessons];
    [lessons[from], lessons[to]] = [lessons[to], lessons[from]];
    setError("");
    try {
      await request<AdminSection[]>(`${basePath}/${section.id}/lessons/reorder`, {
        method: "PUT",
        body: JSON.stringify({ lessonIds: lessons.map((lesson) => lesson.id) }),
      });
      await load();
    } catch (cause) {
      setError(errorText(cause));
    }
  }

  function updateNewLesson(sectionId: string, key: keyof LessonValues, value: string | boolean) {
    setNewLessons((current) => {
      const values = current[sectionId] ?? toLessonValues();
      return { ...current, [sectionId]: { ...values, [key]: value } };
    });
  }

  return (
    <section className="dashboard-section curriculum-admin">
      <div className="dashboard-section-heading">
        <div><span>مدیریت محتوا</span><h2>فصل‌ها و جلسات · {courseTitle}</h2></div>
        <button className="text-link" disabled={loading} onClick={() => void load()} type="button">تازه‌سازی ↻</button>
      </div>
      <form className="admin-course-form curriculum-admin-add-section" onSubmit={addSection}>
        <label>
          عنوان فصل جدید
          <input maxLength={180} onChange={(event) => setSectionTitle(event.target.value)} required value={sectionTitle} />
        </label>
        <div className="admin-course-form__actions">
          <button className="button button--primary button--small" disabled={saving} type="submit">
            {saving ? "در حال ذخیره…" : "افزودن فصل"}
          </button>
        </div>
      </form>
      {error && <p className="auth-error" role="alert">{error}</p>}
      {notice && <p className="admin-course-notice" role="status">{notice}</p>}
      {loading ? <div className="dashboard-empty" role="status">در حال دریافت سرفصل‌ها…</div> : sections.length === 0 ? (
        <div className="dashboard-empty">هنوز فصلی برای این دوره ثبت نشده است.</div>
      ) : (
        <div className="curriculum-admin-sections">
          {sections.map((section, sectionIndex) => (
            <article className="curriculum-admin-section" key={section.id}>
              <header className="curriculum-admin-section-heading">
                <div>
                  <span className="row-index">{String(sectionIndex + 1).padStart(2, "0")}</span>
                  <h3>{section.title}</h3>
                  <small>{section.lessons.length} جلسه</small>
                </div>
                <div className="admin-course-actions">
                  <button className="text-link" disabled={sectionIndex === 0} onClick={() => void reorderSections(sectionIndex, sectionIndex - 1)} type="button">↑</button>
                  <button className="text-link" disabled={sectionIndex === sections.length - 1} onClick={() => void reorderSections(sectionIndex, sectionIndex + 1)} type="button">↓</button>
                  <button className="text-link" onClick={() => void editSection(section)} type="button">تغییر نام</button>
                  <button className="text-link" onClick={() => void deleteSection(section)} type="button">حذف فصل</button>
                </div>
              </header>
              <div className="curriculum-admin-lessons">
                {section.lessons.map((lesson, lessonIndex) => (
                  <div className="curriculum-admin-lesson-wrap" key={lesson.id}>
                    <div className="curriculum-admin-order">
                      <button aria-label="انتقال جلسه به بالا" className="text-link" disabled={lessonIndex === 0} onClick={() => void reorderLessons(section, lessonIndex, lessonIndex - 1)} type="button">↑</button>
                      <button aria-label="انتقال جلسه به پایین" className="text-link" disabled={lessonIndex === section.lessons.length - 1} onClick={() => void reorderLessons(section, lessonIndex, lessonIndex + 1)} type="button">↓</button>
                    </div>
                    <AdminLessonRow
                      courseId={courseId}
                      lesson={lesson}
                      onChange={() => void load()}
                      onError={setError}
                      sectionId={section.id}
                    />
                  </div>
                ))}
                <form className="admin-course-form curriculum-admin-new-lesson" onSubmit={(event) => void addLesson(event, section.id)}>
                  <label>
                    جلسه جدید
                    <input maxLength={180} onChange={(event) => updateNewLesson(section.id, "title", event.target.value)} placeholder="عنوان جلسه" required value={(newLessons[section.id] ?? toLessonValues()).title} />
                  </label>
                  <label>
                    مدت (ثانیه)
                    <input min="0" onChange={(event) => updateNewLesson(section.id, "durationSec", event.target.value)} type="number" value={(newLessons[section.id] ?? toLessonValues()).durationSec} />
                  </label>
                  <label className="curriculum-admin-new-video">
                    شناسه ویدیو در VdoCipher (نه نشانی اینترنتی)
                    <input dir="ltr" maxLength={120} onChange={(event) => updateNewLesson(section.id, "videoKey", event.target.value)} placeholder="شناسه ویدیوی بارگذاری‌شده در VdoCipher" value={(newLessons[section.id] ?? toLessonValues()).videoKey} />
                  </label>
                  <label className="admin-course-free-option">
                    <input checked={(newLessons[section.id] ?? toLessonValues()).isPreview} onChange={(event) => updateNewLesson(section.id, "isPreview", event.target.checked)} type="checkbox" />
                    پیش‌نمایش رایگان
                  </label>
                  <label className="admin-course-free-option">
                    <input checked={(newLessons[section.id] ?? toLessonValues()).isPublished} onChange={(event) => updateNewLesson(section.id, "isPublished", event.target.checked)} type="checkbox" />
                    جلسه منتشرشده
                  </label>
                  <div className="admin-course-form__actions">
                    <button className="button button--primary button--small" disabled={saving} type="submit">افزودن جلسه</button>
                  </div>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="course-video-disclosure">
        فایل باید ابتدا در VdoCipher بارگذاری شود و شناسه‌ی ویدیوی آن ثبت شود؛ API نشانی اینترنتی مستقیم را به‌عنوان شناسه نمی‌پذیرد. حذف فصل یا جلسه‌ای که سابقه یادگیری دارد برای حفظ سوابق رد می‌شود.
      </p>
    </section>
  );
}
