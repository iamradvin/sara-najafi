"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type AutoSliderProps = {
  label: string;
  items: ReactNode[];
  className?: string;
  hideControls?: boolean;
  mobileItemsPerPage?: number;
  tabletItemsPerPage?: number;
  desktopItemsPerPage?: number;
  overlapOnMobile?: boolean;
  pageClassName?: string;
};

export function AutoSlider({
  label,
  items,
  className,
  hideControls = false,
  mobileItemsPerPage = 1,
  tabletItemsPerPage = 2,
  desktopItemsPerPage = 3,
  overlapOnMobile = false,
  pageClassName,
}: Readonly<AutoSliderProps>) {
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(3);
  const [isMobile, setIsMobile] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const pointerStart = useRef<{ id: number; x: number } | null>(null);
  const swiped = useRef(false);
  const paused = userPaused || hovered || focused || dragging;
  const overlapping = overlapOnMobile && isMobile;
  const pageCount = Math.max(
    1,
    overlapping ? items.length - perPage + 1 : Math.ceil(items.length / perPage),
  );
  const activePage = Math.min(page, pageCount - 1);
  const startIndex = overlapping ? activePage : activePage * perPage;
  const visibleItems = useMemo(
    () => items.slice(startIndex, startIndex + perPage),
    [items, perPage, startIndex],
  );

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 680px)");
    const tablet = window.matchMedia("(max-width: 900px)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const updatePreferences = () => {
      setIsMobile(mobile.matches);
      setPerPage(
        mobile.matches
          ? mobileItemsPerPage
          : tablet.matches
            ? tabletItemsPerPage
            : desktopItemsPerPage,
      );
      setReducedMotion(motion.matches);
    };

    updatePreferences();
    mobile.addEventListener("change", updatePreferences);
    tablet.addEventListener("change", updatePreferences);
    motion.addEventListener("change", updatePreferences);
    return () => {
      mobile.removeEventListener("change", updatePreferences);
      tablet.removeEventListener("change", updatePreferences);
      motion.removeEventListener("change", updatePreferences);
    };
  }, [desktopItemsPerPage, mobileItemsPerPage, tabletItemsPerPage]);

  useEffect(() => {
    if (paused || reducedMotion || pageCount < 2) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        setPage((current) => (current + 1) % pageCount);
      }
    }, 5000);
    return () => window.clearInterval(timer);
  }, [pageCount, paused, reducedMotion]);

  if (items.length === 0) return null;

  return (
    <div
      aria-label={label}
      aria-roledescription="carousel"
      className={`auto-slider${className ? ` ${className}` : ""}`}
      role="region"
      onBlur={(event) => {
        if (!(event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget))) {
          setFocused(false);
        }
      }}
      onFocus={() => setFocused(true)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onPointerDown={(event) => {
        if (event.pointerType === "mouse" || pageCount < 2) return;
        pointerStart.current = { id: event.pointerId, x: event.clientX };
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragging(true);
      }}
      onPointerUp={(event) => {
        const start = pointerStart.current;
        if (!start || start.id !== event.pointerId) return;
        const delta = event.clientX - start.x;
        pointerStart.current = null;
        setDragging(false);
        if (Math.abs(delta) < 40) return;
        swiped.current = true;
        setPage((current) => (current + (delta < 0 ? 1 : -1) + pageCount) % pageCount);
      }}
      onPointerCancel={() => {
        pointerStart.current = null;
        setDragging(false);
      }}
      onClickCapture={(event) => {
        if (!swiped.current) return;
        swiped.current = false;
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <div
        aria-live="off"
        className={`auto-slider-page${pageClassName ? ` ${pageClassName}` : ""}`}
        key={`${activePage}-${perPage}`}
      >
        {visibleItems}
      </div>
      {pageCount > 1 && !hideControls && (
        <div className="auto-slider-controls">
          <div className="auto-slider-dots" role="group" aria-label="انتخاب صفحه اسلایدر">
            {Array.from({ length: pageCount }, (_, index) => (
              <button
                aria-current={activePage === index ? "true" : undefined}
                aria-label={`رفتن به اسلاید ${index + 1}`}
                className={`auto-slider-dot${activePage === index ? " is-active" : ""}`}
                key={index}
                onClick={() => setPage(index)}
                type="button"
              />
            ))}
          </div>
          <div className="auto-slider-buttons">
            {!reducedMotion && (
              <button
                aria-label={userPaused ? "شروع پخش خودکار" : "توقف پخش خودکار"}
                className="auto-slider-control"
                onClick={() => setUserPaused((current) => !current)}
                type="button"
              >
                {userPaused ? "▶" : "Ⅱ"}
              </button>
            )}
            <button
              aria-label="اسلاید قبلی"
              className="auto-slider-control"
              onClick={() => setPage((activePage - 1 + pageCount) % pageCount)}
              type="button"
            >
              →
            </button>
            <button
              aria-label="اسلاید بعدی"
              className="auto-slider-control"
              onClick={() => setPage((activePage + 1) % pageCount)}
              type="button"
            >
              ←
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
