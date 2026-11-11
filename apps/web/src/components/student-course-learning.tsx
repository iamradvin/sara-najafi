"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiUrl, courseImageUrl } from "@/lib/api";
import {
  getBrandCourseDescription,
  getBrandCourseLessonTitle,
  getBrandCourseTitle,
} from "@/lib/courses";

type LearningResponse = {
  course: {
    id: string;
    slug: string;
    title: string;
    description: string;
    thumbnailUrl: string | null;
    sections: {
      id: string;
      title: string;
      position: number;
      lessons: {
        id: string;
        title: string;
        description: string | null;
        durationSec: number;
        isPreview: boolean;
        videoKey: string | null;
        position: number;
        resources: {
          id: string;
          title: string;
          url: string;
          fileName: string | null;
          sizeBytes: number | null;
        }[];
        progress: { isComplete: boolean; watchedSeconds: number; lastWatchedAt: string }[];
      }[];
    }[];
    progress: {
      totalLessons: number;
      completedLessons: number;
      progressPercent: number;
      lastLessonId: string | null;
      completedAt: string | null;
    };
  };
};
type ApiMessage = { message?: string | string[] };

function messageFrom(payload: ApiMessage) {
  return Array.isArray(payload.message)
    ? payload.message.join("، ")
    : payload.message ?? "دریافت اطلاعات دوره انجام نشد.";
}

export function StudentCourseLearning({ courseId }: Readonly<{ courseId: string }>) {
  const [data, setData] = useState<LearningResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyLesson, setBusyLesson] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async (signal?: AbortSignal) => {
    const response = await fetch(apiUrl(`/student/courses/${courseId}/learning`), {
      credentials: "include",
      cache: "no-store",
      signal,
    });
    const payload = (await response.json()) as LearningResponse & ApiMessage;
    if (!response.ok) throw new Error(messageFrom(payload));
    return payload;
  }, [courseId]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal)
      .then((payload) => {
        if (!controller.signal.aborted) setData(payload);
      })
      .catch((cause: unknown) => {
        if (!(cause instanceof DOMException && cause.name === "AbortError")) {
          setError(cause instanceof Error ? cause.message : "دریافت اطلاعات دوره انجام نشد.");
        }
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [load]);

  async function completeLesson(lessonId: string, durationSec: number) {
    setBusyLesson(lessonId);
    setError("");
    try {
      const response = await fetch(apiUrl(`/student/lessons/${lessonId}/progress`), {
        method: "PATCH",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ watchedSeconds: durationSec, coveredSeconds: durationSec }),
      });
      const payload = (await response.json()) as ApiMessage;
      if (!response.ok) throw new Error(messageFrom(payload));
      setData(await load());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "ذخیره پیشرفت انجام نشد.");
    } finally {
      setBusyLesson(null);
    }
  }

  if (loading) return <div className="dashboard-empty" role="status">در حال بارگذاری دوره…</div>;
  if (error && !data) return <p className="auth-error" role="alert">{error}</p>;
  if (!data) return null;
  const { course } = data;

  return (
    <section className="student-learning">
      <Link className="text-link" href="/student/courses">← بازگشت به دوره‌های من</Link>
      <header className="student-learning-heading">
        <div>
          <span className="eyebrow">فضای یادگیری</span>
          <h1>{getBrandCourseTitle(course.slug)}</h1>
          <p>{getBrandCourseDescription(course.slug)}</p>
        </div>
      </header>
      <div className="student-learning-progress">
        <div>
          <strong>{course.progress.progressPercent.toLocaleString("fa-IR")}٪</strong>
          <span>{course.progress.completedLessons.toLocaleString("fa-IR")} از {course.progress.totalLessons.toLocaleString("fa-IR")} جلسه تکمیل شده</span>
        </div>
        <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={course.progress.progressPercent}>
          <span style={{ width: `${course.progress.progressPercent}%` }} />
        </div>
        {course.progress.completedAt && <p role="status">این دوره را به پایان رسانده‌ای.</p>}
      </div>
      {error && <p className="auth-error" role="alert">{error}</p>}
      {course.sections.length ? course.sections.map((section, sectionIndex) => (
        <section className="dashboard-section student-learning-module" key={section.id}>
          <div className="dashboard-section-heading"><div><span>بخش {section.position.toLocaleString("fa-IR")}</span><h2>{getBrandCourseLessonTitle(course.slug, sectionIndex)}</h2></div></div>
          {section.lessons.map((lesson, lessonIndex) => {
            const progress = lesson.progress[0];
            return (
              <article className="student-learning-lesson" key={lesson.id}>
                <div>
                  <strong>{getBrandCourseLessonTitle(course.slug, lessonIndex)}</strong>
                  <p>{lesson.description || (lesson.durationSec
                    ? `${Math.ceil(lesson.durationSec / 60).toLocaleString("fa-IR")} دقیقه`
                    : "محتوای متنی")}</p>
                  {lesson.resources.length > 0 && (
                    <ul className="student-learning-resources">
                      {lesson.resources.map((resource) => (
                        <li key={resource.id}>
                          <a href={resource.url.startsWith("/") ? courseImageUrl(resource.url) : resource.url} rel="noreferrer" target="_blank">
                            دانلود: {resource.title}{resource.fileName ? ` (${resource.fileName})` : ""}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="student-learning-lesson-actions">
                  {lesson.videoKey && (
                    <Link className="button button--outline button--small" href={`/student/lessons/${lesson.id}`}>پخش امن</Link>
                  )}
                  {progress?.isComplete ? (
                    <span className="status-chip status-chip--published">تکمیل‌شده</span>
                  ) : (
                    <button
                      className="button button--primary button--small"
                      disabled={busyLesson === lesson.id}
                      onClick={() => void completeLesson(lesson.id, lesson.durationSec)}
                      type="button"
                    >
                      {busyLesson === lesson.id ? "در حال ذخیره…" : "علامت‌گذاری به‌عنوان تکمیل‌شده"}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )) : (
        <div className="dashboard-empty"><strong>محتوای این دوره هنوز آماده نیست.</strong></div>
      )}
    </section>
  );
}
