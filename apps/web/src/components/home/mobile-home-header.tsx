"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { HomeIcon } from "@/components/home/home-icon";
import { PwaInstallButton } from "@/components/pwa-install-button";
import { NavigationDrawer } from "@/components/navigation/navigation-drawer";
import { apiClient } from "@/lib/api";
import { getBrandCourseTitle } from "@/lib/courses";
import { articles } from "@/lib/articles";
import type { PublishedCourseSummary } from "@attractory/types";

type SearchArticle = (typeof articles)[number];
type SearchState = "idle" | "loading" | "ready" | "error";

export function MobileHomeHeader() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [overlay, setOverlay] = useState<"search" | "notifications" | null>(null);
  const [query, setQuery] = useState("");
  const [courseResults, setCourseResults] = useState<PublishedCourseSummary[]>([]);
  const [searchState, setSearchState] = useState<SearchState>("idle");
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const normalizedQuery = query.trim();
  const articleResults = useMemo<SearchArticle[]>(
    () => normalizedQuery.length < 2 ? [] : articles.filter((article) =>
      `${article.title} ${article.excerpt} ${article.category}`.includes(normalizedQuery),
    ).slice(0, 5),
    [normalizedQuery],
  );

  useEffect(() => {
    if (overlay !== "search" || normalizedQuery.length < 2) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setSearchState("loading");
      void apiClient.courses.searchPublished(
        { search: normalizedQuery, limit: 5 },
        { cache: "no-store", signal: controller.signal },
      )
        .then((result) => {
          if (controller.signal.aborted) return;
          setCourseResults(result.data);
          setSearchState("ready");
        })
        .catch((cause: unknown) => {
          if (cause instanceof DOMException && cause.name === "AbortError") return;
          if (!controller.signal.aborted) setSearchState("error");
        });
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [normalizedQuery, overlay]);

  const closeOverlay = useCallback(() => {
    setOverlay(null);
    window.setTimeout(() => {
      if (overlay === "search") searchButtonRef.current?.focus();
      else notificationButtonRef.current?.focus();
    }, 0);
  }, [overlay]);

  useEffect(() => {
    if (!overlay) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (overlay === "search") searchInputRef.current?.focus();
    else overlayRef.current?.querySelector<HTMLElement>("button")?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeOverlay();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [closeOverlay, overlay]);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  function openOverlay(next: "search" | "notifications") {
    setQuery("");
    setOverlay(next);
  }

  return (
    <>
      <header className="home-mobile-header" dir="rtl">
        <div className="home-mobile-header__actions">
          <button
            aria-label="اعلان‌ها"
            className="home-mobile-header__icon"
            onClick={() => openOverlay("notifications")}
            ref={notificationButtonRef}
            type="button"
          >
            <HomeIcon name="bell" />
          </button>
          <button
            aria-label="جستجو در دوره‌ها و مقالات"
            className="home-mobile-header__icon"
            onClick={() => openOverlay("search")}
            ref={searchButtonRef}
            type="button"
          >
            <HomeIcon name="search" />
          </button>
        </div>
        <Link aria-label="سارا نجفی، صفحه اصلی" className="home-mobile-header__brand" href="/#top">
          <BrandLogo size={42} />
        </Link>
        <div className="home-mobile-header__menu-actions">
          <PwaInstallButton variant="mobile" />
          <button
            aria-expanded={drawerOpen}
            aria-label={drawerOpen ? "بستن منو" : "باز کردن منو"}
            className="home-mobile-header__icon home-mobile-header__menu"
            onClick={() => setDrawerOpen(true)}
            ref={menuButtonRef}
            type="button"
          >
            <HomeIcon name="menu" />
          </button>
        </div>
      </header>

      <NavigationDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        triggerRef={menuButtonRef}
      />

      {overlay && (
        <div
          aria-label={overlay === "search" ? "جستجو" : "اعلان‌ها"}
          aria-modal="true"
          className="home-action-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeOverlay();
          }}
          ref={overlayRef}
          role="dialog"
        >
          <div className="home-action-panel">
            <div className="home-action-panel__heading">
              <h2>{overlay === "search" ? "جستجو در محتوا" : "اعلان‌ها"}</h2>
              <button aria-label="بستن" className="home-action-panel__close" onClick={closeOverlay} type="button">
                <HomeIcon name="close" />
              </button>
            </div>
            {overlay === "search" ? (
              <>
                <label className="home-search-field">
                  <HomeIcon name="search" />
                  <input
                    autoComplete="off"
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setSearchState("idle");
                      setCourseResults([]);
                    }}
                    placeholder="نام دوره یا موضوع مقاله…"
                    ref={searchInputRef}
                    type="search"
                    value={query}
                  />
                </label>
                {normalizedQuery.length < 2 ? (
                  <p className="home-search-hint">برای جستجو، دست‌کم دو حرف وارد کن.</p>
                ) : searchState === "loading" ? (
                  <p className="home-search-hint" role="status">در حال جستجو…</p>
                ) : (
                  <div className="home-search-results" aria-live="polite">
                    {searchState === "error" && (
                      <p role="alert">جستجوی دوره‌ها انجام نشد؛ مقاله‌های محلی همچنان در نتایج هستند.</p>
                    )}
                    {courseResults.map((course) => (
                      <Link href={`/courses/${course.slug}`} key={course.id} onClick={closeOverlay}>
                        <span>دوره</span><strong>{getBrandCourseTitle(course.slug)}</strong>
                      </Link>
                    ))}
                    {articleResults.map((article) => (
                      <Link href={`/articles/${article.slug}`} key={article.slug} onClick={closeOverlay}>
                        <span>مقاله</span><strong>{article.title}</strong>
                      </Link>
                    ))}
                    {searchState === "ready" && !courseResults.length && !articleResults.length && (
                      <p>محتوایی با این عبارت پیدا نشد.</p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="home-empty-feature">
                <HomeIcon name="bell" />
                <strong>اعلانی برای نمایش نیست</strong>
                <p>در نسخه‌ی فعلی، API اعلان‌ها در پروژه وجود ندارد. بعد از اتصال سرویس، اعلان‌های حساب اینجا نمایش داده می‌شوند.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
