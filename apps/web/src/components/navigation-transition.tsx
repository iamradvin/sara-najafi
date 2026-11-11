"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export function NavigationTransition() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<"hidden" | "loading" | "leaving">("hidden");
  const previousPathname = useRef(pathname);
  const fallbackTimer = useRef<number | null>(null);
  const exitTimer = useRef<number | null>(null);
  const phaseRef = useRef(phase);

  const updatePhase = useCallback((nextPhase: typeof phase) => {
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
  }, []);

  useEffect(() => {
    function clearPendingTimers() {
      if (fallbackTimer.current !== null) window.clearTimeout(fallbackTimer.current);
      if (exitTimer.current !== null) window.clearTimeout(exitTimer.current);
      fallbackTimer.current = null;
      exitTimer.current = null;
    }

    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;

      const link = event.target.closest("a[href]");
      if (!(link instanceof HTMLAnchorElement) || link.target || link.hasAttribute("download")) return;

      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if (destination.pathname === window.location.pathname) return;

      clearPendingTimers();
      updatePhase("loading");
      fallbackTimer.current = window.setTimeout(() => {
        updatePhase("leaving");
        exitTimer.current = window.setTimeout(() => updatePhase("hidden"), 220);
      }, 8000);
    }

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      clearPendingTimers();
    };
  }, [updatePhase]);

  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    if (fallbackTimer.current !== null) window.clearTimeout(fallbackTimer.current);
    if (phaseRef.current !== "loading") return;

    updatePhase("leaving");
    exitTimer.current = window.setTimeout(() => updatePhase("hidden"), 220);
  }, [pathname, updatePhase]);
  useEffect(() => () => {
    if (fallbackTimer.current !== null) window.clearTimeout(fallbackTimer.current);
    if (exitTimer.current !== null) window.clearTimeout(exitTimer.current);
  }, []);

  if (phase === "hidden") return null;

  return (
    <div
      aria-label="در حال بارگذاری صفحه"
      aria-live="polite"
      className={`navigation-loader${phase === "leaving" ? " is-leaving" : ""}`}
      role="status"
    >
      <span aria-hidden="true" className="navigation-loader__spinner">
        {Array.from({ length: 8 }, (_, index) => (
          <span className="navigation-loader__dot" key={index} />
        ))}
      </span>
    </div>
  );
}
