"use client";

import { useSyncExternalStore } from "react";

function getThemeSnapshot(): "light" | "dark" {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function subscribeToTheme(onChange: () => void) {
  window.addEventListener("attractory-theme-change", onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener("attractory-theme-change", onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function ThemeToggle({ iconOnly = false }: Readonly<{ iconOnly?: boolean }>) {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, () => "dark");

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    localStorage.setItem("attractory-theme", nextTheme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      "content",
      nextTheme === "light" ? "#f8f3f0" : "#200910",
    );
    window.dispatchEvent(new Event("attractory-theme-change"));
  }

  return (
    <button
      aria-label={`فعال‌کردن پوسته ${theme === "dark" ? "روشن" : "تاریک"}`}
      aria-pressed={theme === "light"}
      className={`theme-toggle${iconOnly ? " theme-toggle--icon-only theme-toggle--floating" : ""}`}
      onClick={toggleTheme}
      title={iconOnly ? undefined : `پوسته ${theme === "dark" ? "روشن" : "تاریک"}`}
      type="button"
    >
      {theme === "dark" ? (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
        </svg>
      ) : (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
          <path d="M20.2 15.3A8.5 8.5 0 0 1 8.7 3.8 8.5 8.5 0 1 0 20.2 15.3Z" />
        </svg>
      )}
      {!iconOnly && <span>{theme === "dark" ? "روشن" : "تاریک"}</span>}
    </button>
  );
}
