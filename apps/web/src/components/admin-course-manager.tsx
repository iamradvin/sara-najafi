"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { apiUrl, courseImageUrl } from "@/lib/api";
import { AdminCurriculumManager } from "@/components/admin-curriculum-manager";
import { slugFromText } from "@/lib/slug";

type AdminCourse = {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  status: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS";
  priceToman: number | null;
  isFree: boolean;
  estimatedMinutes: number;
  currency: string;
  language: string;
  instructorId: string | null;
  instructor: { id: string; name: string; avatarUrl: string | null } | null;
  categories: { category: { id: string; name: string; slug: string } }[];
  _count: { sections: number; enrollments: number };
};

type CourseFormValues = {
  slug: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  level: AdminCourse["level"];
  priceToman: string;
  isFree: boolean;
  estimatedMinutes: string;
  categoryName: string;
  categorySlug: string;
  currency: string;
  language: string;
  instructorId: string;
  categoryIds: string[];
};

type Instructor = { id: string; name: string; email: string | null };
type CategoryOption = { id: string; name: string };
type SessionUser = { roles: string[] };

const initialValues: CourseFormValues = {
  slug: "",
  title: "",
  description: "",
  thumbnailUrl: "",
  level: "ALL_LEVELS",
  priceToman: "",
  isFree: false,
  estimatedMinutes: "0",
  categoryName: "",
  categorySlug: "",
  currency: "TOMAN",
  language: "fa",
  instructorId: "",
  categoryIds: [],
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "درخواست انجام نشد.";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const result = (await response.json()) as T & { message?: string | string[] };
  if (!response.ok) {
    const message = result.message;
    throw new Error(Array.isArray(message) ? message.join("، ") : message ?? "درخواست انجام نشد.");
  }
  return result;
}

export function AdminCourseManager() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [values, setValues] = useState<CourseFormValues>(initialValues);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [curriculumCourse, setCurriculumCourse] = useState<AdminCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [busyCourseId, setBusyCourseId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await request<{ data: AdminCourse[] }>("/admin/courses");
      setCourses(result.data);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadCourses);
  }, [loadCourses]);

  useEffect(() => {
    const controller = new AbortController();
    void fetch(apiUrl("/auth/me"), { credentials: "include", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return;
        const user = (await response.json()) as SessionUser;
        const categoryList = await request<CategoryOption[]>("/categories/manage");
        setCategoryOptions(categoryList);
        const admin = user.roles.includes("SUPER_ADMIN");
        setIsAdmin(admin);
        if (admin) {
          const result = await request<Instructor[]>("/admin/instructors");
          setInstructors(result);
        }
      })
      .catch((cause: unknown) => {
        if (!(cause instanceof DOMException && cause.name === "AbortError")) {
          setError(getErrorMessage(cause));
        }
      });
    return () => controller.abort();
  }, []);

  function updateField<K extends keyof CourseFormValues>(key: K, value: CourseFormValues[K]) {
    setValues((current) => ({
      ...current,
      [key]: value,
      ...(key === "title" ? { slug: slugFromText(String(value)) } : {}),
      ...(key === "categoryName" ? { categorySlug: slugFromText(String(value)) } : {}),
    }));
  }

  function startEditing(course: AdminCourse) {
    setEditingId(course.id);
    setValues({
      slug: course.slug,
      title: course.title,
      description: course.description,
      thumbnailUrl: course.thumbnailUrl ?? "",
      level: course.level,
      priceToman: course.priceToman?.toString() ?? "",
      isFree: course.isFree,
      estimatedMinutes: course.estimatedMinutes.toString(),
      categoryName: course.categories[0]?.category.name ?? "",
      categorySlug: course.categories[0]?.category.slug ?? "",
      currency: course.currency,
      language: course.language,
      instructorId: course.instructorId ?? "",
      categoryIds: course.categories.map(({ category }) => category.id),
    });
    setNotice(null);
    setError(null);
  }

  function resetForm() {
    setEditingId(null);
    setValues(initialValues);
  }

  async function uploadImage(file: File | undefined) {
    if (!file) return;
    setUploadingImage(true);
    setError(null);
    setNotice(null);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch(apiUrl("/admin/course-images"), {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const payload = (await response.json()) as { url?: string; message?: string | string[] };
      if (!response.ok || !payload.url) {
        const message = payload.message;
        throw new Error(
          Array.isArray(message)
            ? message.join("، ")
            : message ?? "بارگذاری تصویر انجام نشد.",
        );
      }
      updateField("thumbnailUrl", payload.url);
      setNotice("تصویر بارگذاری شد؛ برای ثبت روی دوره، فرم را ذخیره کن.");
    } catch (uploadError) {
      setError(getErrorMessage(uploadError));
    } finally {
      setUploadingImage(false);
    }
  }

  async function submitCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (Boolean(values.categoryName) !== Boolean(values.categorySlug)) {
      setError("برای ثبت دسته‌بندی، نام و نشانی آن را هر دو وارد کن.");
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    const payload = {
      slug: values.slug,
      title: values.title,
      description: values.description,
      thumbnailUrl: values.thumbnailUrl || null,
      level: values.level,
      priceToman: values.priceToman ? Number(values.priceToman) : null,
      isFree: values.isFree,
      estimatedMinutes: Number(values.estimatedMinutes),
      currency: values.currency,
      language: values.language,
      categoryIds: values.categoryIds,
      ...(isAdmin && values.instructorId ? { instructorId: values.instructorId } : {}),
      category:
        values.categoryName && values.categorySlug
          ? { name: values.categoryName, slug: values.categorySlug }
          : null,
    };

    try {
      await request<AdminCourse>(
        editingId ? `/admin/courses/${editingId}` : "/admin/courses",
        {
          method: editingId ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        },
      );
      setNotice(editingId ? "تغییرات دوره ذخیره شد." : "دوره به‌صورت پیش‌نویس ایجاد شد.");
      setCurriculumCourse(null);
      resetForm();
      await loadCourses();
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(course: AdminCourse) {
    const action = course.status === "PUBLISHED"
      ? "unpublish"
      : !isAdmin
        ? "review"
        : "publish";
    setBusyCourseId(course.id);
    setError(null);
    setNotice(null);
    try {
      await request<AdminCourse>(`/admin/courses/${course.id}/${action}`, { method: "POST" });
      setNotice(
        action === "publish"
          ? "دوره منتشر شد."
          : action === "review"
            ? "دوره برای بازبینی مدیر ارسال شد."
            : "دوره از فهرست عمومی خارج شد.",
      );
      await loadCourses();
    } catch (statusError) {
      setError(getErrorMessage(statusError));
    } finally {
      setBusyCourseId(null);
    }
  }

  async function deleteCourse(course: AdminCourse) {
    if (!window.confirm(`دوره «${course.title}» حذف شود؟ اگر سابقه ثبت‌نام یا سفارش داشته باشد، حذف رد می‌شود.`)) return;
    setBusyCourseId(course.id);
    setError(null);
    setNotice(null);
    try {
      await request(`/admin/courses/${course.id}`, { method: "DELETE" });
      setNotice("دوره حذف شد.");
      await loadCourses();
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setBusyCourseId(null);
    }
  }

  return (
    <div className="admin-course-manager">
      <section className="dashboard-section">
        <div className="dashboard-section-heading">
          <div><span>مدیریت محتوا</span><h2>{editingId ? "ویرایش دوره" : "افزودن دوره"}</h2></div>
          {editingId && <button className="text-link" onClick={resetForm} type="button">لغو ویرایش</button>}
        </div>
        <form className="admin-course-form" onSubmit={submitCourse}>
          <label>
            عنوان دوره
            <input maxLength={180} onChange={(event) => updateField("title", event.target.value)} required value={values.title} />
          </label>
          <label className="admin-course-form__wide">
            دسته‌بندی‌های موجود
            <select multiple onChange={(event) => updateField("categoryIds", Array.from(event.target.selectedOptions, (option) => option.value))} size={Math.min(5, Math.max(2, categoryOptions.length))} value={values.categoryIds}>
              {categoryOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
            </select>
            <small>برای انتخاب چند مورد، Ctrl یا Command را نگه دار.</small>
          </label>
          <label>
            نشانی خودکار دوره
            <input dir="ltr" maxLength={180} readOnly required value={values.slug} />
          </label>
          <label className="admin-course-form__wide">
            توضیحات
            <textarea minLength={10} onChange={(event) => updateField("description", event.target.value)} required rows={3} value={values.description} />
          </label>
          <label>
            تصویر دوره (JPG، PNG یا WebP؛ حداکثر ۸ مگابایت)
            <input
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => void uploadImage(event.target.files?.[0])}
              type="file"
            />
          </label>
          <div className="admin-course-image-preview">
            {values.thumbnailUrl ? (
              <Image
                alt="پیش‌نمایش تصویر دوره"
                height={100}
                src={courseImageUrl(values.thumbnailUrl)}
                unoptimized={values.thumbnailUrl.startsWith("/uploads/")}
                width={160}
              />
            ) : <span>پیش‌نمایش تصویر دوره</span>}
            {uploadingImage && <small role="status">در حال بارگذاری تصویر…</small>}
          </div>
          <label>
            سطح
            <select onChange={(event) => updateField("level", event.target.value as AdminCourse["level"])} value={values.level}>
              <option value="ALL_LEVELS">مناسب همه</option>
              <option value="BEGINNER">مقدماتی</option>
              <option value="INTERMEDIATE">متوسط</option>
              <option value="ADVANCED">پیشرفته</option>
            </select>
          </label>
          <label>
            قیمت (تومان)
            <input min="0" onChange={(event) => updateField("priceToman", event.target.value)} placeholder="خالی = اعلام‌نشده" type="number" value={values.priceToman} />
          </label>
          <label className="admin-course-free-option">
            <input checked={values.isFree} onChange={(event) => updateField("isFree", event.target.checked)} type="checkbox" />
            این دوره رایگان است
          </label>
          <label>
            مدت آموزش (دقیقه)
            <input min="0" onChange={(event) => updateField("estimatedMinutes", event.target.value)} required type="number" value={values.estimatedMinutes} />
          </label>
          <label>
            زبان
            <select onChange={(event) => updateField("language", event.target.value)} value={values.language}>
              <option value="fa">فارسی</option>
              <option value="en">English</option>
            </select>
          </label>
          <label>
            واحد قیمت
            <input readOnly value="تومان (واحد پشتیبانی‌شده در پرداخت)" />
          </label>
          {isAdmin && (
            <label>
              مدرس
              <select onChange={(event) => updateField("instructorId", event.target.value)} value={values.instructorId}>
                <option value="">بدون مدرس</option>
                {instructors.map((instructor) => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.name}{instructor.email ? ` · ${instructor.email}` : ""}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            دسته‌بندی
            <input maxLength={120} onChange={(event) => updateField("categoryName", event.target.value)} value={values.categoryName} />
          </label>
          <label>
            نشانی خودکار دسته‌بندی
            <input dir="ltr" maxLength={140} readOnly value={values.categorySlug} />
          </label>
          <div className="admin-course-form__actions">
            <button className="button button--primary button--small" disabled={saving || uploadingImage || !values.slug} type="submit">
              {saving ? "در حال ذخیره…" : editingId ? "ذخیره تغییرات" : "ایجاد پیش‌نویس"}
            </button>
          </div>
        </form>
      </section>

      {error && <p className="auth-error" role="alert">{error}</p>}
      {notice && <p className="admin-course-notice" role="status">{notice}</p>}

      <section className="dashboard-section">
        <div className="dashboard-section-heading">
          <div><span>محتوای ثبت‌شده</span><h2>دوره‌ها</h2></div>
          <button className="text-link" disabled={loading} onClick={() => void loadCourses()} type="button">
            تازه‌سازی <span>↻</span>
          </button>
        </div>
        {loading ? (
          <div className="dashboard-empty" role="status">در حال دریافت دوره‌ها…</div>
        ) : courses.length === 0 ? (
          <div className="dashboard-empty">
            <strong>هنوز دوره‌ای ثبت نشده است</strong>
            <p>با فرم بالا یک پیش‌نویس بساز.</p>
          </div>
        ) : (
          <div className="admin-course-list">
            {courses.map((course, index) => (
              <article className="admin-course-row" key={course.id}>
                <span className="row-index">{String(index + 1).padStart(2, "0")}</span>
                {course.thumbnailUrl ? (
                  <Image
                    alt=""
                    height={55}
                    src={courseImageUrl(course.thumbnailUrl)}
                    unoptimized={course.thumbnailUrl.startsWith("/uploads/")}
                    width={72}
                  />
                ) : <span className="admin-course-placeholder" aria-hidden="true">▤</span>}
                <div className="admin-course-info">
                  <strong>{course.title}</strong>
                  <small>
                    {course.categories[0]?.category.name ?? "بدون دسته"} · {course._count.sections} فصل · {course._count.enrollments} دانشجو
                    {course.instructor ? ` · مدرس: ${course.instructor.name}` : ""}
                  </small>
                </div>
                <span className={`status-chip status-chip--${course.status.toLowerCase()}`}>
                  {course.status === "PUBLISHED" ? "منتشرشده" : course.status === "REVIEW" ? "در انتظار بازبینی" : course.status === "ARCHIVED" ? "آرشیو" : "پیش‌نویس"}
                </span>
                <div className="admin-course-actions">
                  <button className="text-link" onClick={() => startEditing(course)} type="button">ویرایش</button>
                  <button className="text-link" onClick={() => setCurriculumCourse(course)} type="button">فصل‌ها</button>
                  <button
                    className="text-link"
                    disabled={busyCourseId === course.id}
                    onClick={() => void changeStatus(course)}
                    type="button"
                  >
                    {busyCourseId === course.id
                      ? "در حال ذخیره…"
                      : course.status === "PUBLISHED"
                        ? "لغو انتشار"
                        : course.status === "REVIEW"
                          ? isAdmin ? "انتشار" : "در انتظار بازبینی"
                          : isAdmin ? "انتشار" : "ارسال برای بازبینی"}
                  </button>
                  {isAdmin && course.status === "PUBLISHED" && (
                    <button className="text-link" disabled={busyCourseId === course.id} onClick={() => void request(`/admin/courses/${course.id}/archive`, { method: "POST" }).then(loadCourses).catch((cause: unknown) => setError(getErrorMessage(cause)))} type="button">آرشیو</button>
                  )}
                  <button className="text-link" disabled={busyCourseId === course.id} onClick={() => void deleteCourse(course)} type="button">حذف امن</button>
                  {course.status === "PUBLISHED" && (
                    <Link className="card-link" href={`/courses/${course.slug}`} aria-label={`مشاهده ${course.title}`}>←</Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      {curriculumCourse && (
        <AdminCurriculumManager
          courseId={curriculumCourse.id}
          courseTitle={curriculumCourse.title}
        />
      )}
    </div>
  );
}
