"use client";

import Link from "next/link";
import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiUrl } from "@/lib/api";
import { getBrandCourseTitleFromStoredTitle } from "@/lib/courses";

type PlaybackGrant = {
  otp: string;
  playbackInfo: string;
  lessonTitle: string;
  courseTitle: string;
};

type ApiMessage = { message?: string | string[] };
type LessonProgress = {
  watchedSeconds: number;
  coveredSeconds: number;
  isComplete: boolean;
  progressPercent: number;
};
type VdoCipherPlayer = {
  video: {
    paused: boolean;
    addEventListener: (event: "playing" | "pause" | "ended", listener: () => void) => void;
    removeEventListener: (event: "playing" | "pause" | "ended", listener: () => void) => void;
  };
  api: {
    getTotalPlayed: () => Promise<number>;
    getTotalCovered: () => Promise<number>;
  };
};

declare global {
  interface Window {
    VdoPlayer?: {
      getInstance: (iframe: HTMLIFrameElement) => VdoCipherPlayer;
    };
  }
}

function messageFromPayload(payload: ApiMessage): string {
  if (Array.isArray(payload.message)) return payload.message[0] ?? "پخش امن ویدیو انجام نشد.";
  return payload.message ?? "پخش امن ویدیو انجام نشد.";
}

export function SecureLessonPlayer({ lessonId }: Readonly<{ lessonId: string }>) {
  const [grant, setGrant] = useState<PlaybackGrant | null>(null);
  const [error, setError] = useState("");
  const [progressError, setProgressError] = useState("");
  const [playerApiReady, setPlayerApiReady] = useState(false);
  const [frameReady, setFrameReady] = useState(false);
  const [progress, setProgress] = useState<LessonProgress | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const saveProgress = useCallback(async (player: VdoCipherPlayer) => {
    const [watchedSeconds, coveredSeconds] = await Promise.all([
      player.api.getTotalPlayed(),
      player.api.getTotalCovered(),
    ]);
    const response = await fetch(apiUrl(`/student/lessons/${lessonId}/progress`), {
      method: "PATCH",
      credentials: "include",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        watchedSeconds: Math.max(0, Math.floor(watchedSeconds)),
        coveredSeconds: Math.max(0, Math.floor(coveredSeconds)),
      }),
    });
    const payload = (await response.json()) as LessonProgress & ApiMessage;
    if (!response.ok) throw new Error(messageFromPayload(payload));
    setProgress(payload);
    setProgressError("");
  }, [lessonId]);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(async () => {
      try {
        const response = await fetch(apiUrl(`/student/lessons/${lessonId}/playback`), {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = (await response.json()) as PlaybackGrant & ApiMessage;
        if (!response.ok) throw new Error(messageFromPayload(payload));
        if (typeof payload.otp !== "string" || typeof payload.playbackInfo !== "string") {
          throw new Error("مجوز موقت پخش معتبر نیست.");
        }
        setGrant(payload);
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError(cause instanceof Error ? cause.message : "ارتباط با سرور برقرار نشد.");
      }
    });
    return () => controller.abort();
  }, [lessonId]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!playerApiReady || !frameReady || !iframe || !window.VdoPlayer) return;

    const player = window.VdoPlayer.getInstance(iframe);
    let interval: ReturnType<typeof setInterval> | undefined;
    let reportInFlight = false;
    const report = () => {
      if (reportInFlight) return;
      reportInFlight = true;
      void saveProgress(player)
        .catch((cause: unknown) => {
          setProgressError(cause instanceof Error ? cause.message : "ذخیره پیشرفت انجام نشد.");
        })
        .finally(() => { reportInFlight = false; });
    };
    const startTracking = () => {
      if (interval) return;
      interval = setInterval(report, 15_000);
    };
    const stopTracking = () => {
      if (interval) clearInterval(interval);
      interval = undefined;
      report();
    };

    player.video.addEventListener("playing", startTracking);
    player.video.addEventListener("pause", stopTracking);
    player.video.addEventListener("ended", stopTracking);
    if (!player.video.paused) startTracking();

    return () => {
      if (interval) clearInterval(interval);
      player.video.removeEventListener("playing", startTracking);
      player.video.removeEventListener("pause", stopTracking);
      player.video.removeEventListener("ended", stopTracking);
    };
  }, [frameReady, playerApiReady, saveProgress]);

  const playerUrl = grant
    ? `https://player.vdocipher.com/v2/?${new URLSearchParams({
        otp: grant.otp,
        playbackInfo: grant.playbackInfo,
      }).toString()}`
    : null;

  return (
    <section className="secure-lesson">
      <Link className="text-link secure-lesson-back" href="/student/courses">← بازگشت به دوره‌های من</Link>
      {error ? (
        <div className="dashboard-empty secure-lesson-state" role="alert">
          <strong>ویدیو در دسترس نیست</strong>
          <p>{error}</p>
        </div>
      ) : !grant || !playerUrl ? (
        <div className="dashboard-empty secure-lesson-state" role="status">در حال دریافت مجوز پخش امن…</div>
      ) : (
        <>
          <Script
            src="https://player.vdocipher.com/v2/api.js"
            strategy="afterInteractive"
            onError={() => setProgressError("اتصال به ابزار ثبت پیشرفت ویدیو برقرار نشد.")}
            onReady={() => setPlayerApiReady(true)}
          />
          <div className="secure-lesson-heading">
            <span>{getBrandCourseTitleFromStoredTitle(grant.courseTitle)}</span>
            <h1>جلسه تخصصی زیبایی مو</h1>
          </div>
          <div className="secure-player-frame">
            <iframe
              allow="encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
              referrerPolicy="no-referrer"
              onLoad={() => setFrameReady(true)}
              ref={iframeRef}
              src={playerUrl}
              title={grant.lessonTitle}
            />
          </div>
          <p className="secure-lesson-note" aria-live="polite">
            {progressError || (progress?.isComplete
              ? "این درس تکمیل شد و پیشرفتت ذخیره شد."
              : progress
                ? `پیشرفت ذخیره‌شده: ${progress.progressPercent.toLocaleString("fa-IR")}٪`
                : "پیشرفت تماشای درس هنگام پخش به‌صورت خودکار ذخیره می‌شود.")}
          </p>
          <p className="secure-lesson-note">
            پخش با مجوز کوتاه‌عمر و DRM انجام می‌شود. ضبط صفحه یا فیلم‌برداری خارجی را نمی‌توان به‌طور مطلق مسدود کرد.
          </p>
        </>
      )}
    </section>
  );
}
