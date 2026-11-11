"use client";

import { useState } from "react";
import Link from "next/link";
import { HomeIcon } from "@/components/home/home-icon";

type ArtworkName = "story" | "favorite" | "file" | "video";

const actions: readonly {
  label: string;
  artwork: ArtworkName;
  href?: string;
  unavailable?: string;
}[] = [
  { label: "استوری‌ها", artwork: "story", unavailable: "بخش استوری‌ها هنوز در سامانه یا API پیاده‌سازی نشده است." },
  { label: "علاقه‌مندی‌ها", artwork: "favorite", unavailable: "ذخیره و نمایش علاقه‌مندی‌ها هنوز به حساب کاربری متصل نیست." },
  { label: "فایل‌های من", artwork: "file", unavailable: "فهرست فایل‌های شخصی هنوز API ندارد؛ فایل‌های هر درس از صفحه‌ی دوره در دسترس‌اند." },
  { label: "ویدئوها", artwork: "video", href: "/student/courses" },
];

function QuickActionArtwork({ name }: Readonly<{ name: ArtworkName }>) {
  switch (name) {
    case "story":
      return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 64 64">
          <rect className="quick-artwork__panel" height="38" rx="10" width="32" x="9" y="13" />
          <rect className="quick-artwork__panel quick-artwork__panel--back" height="38" rx="10" width="32" x="23" y="9" />
          <path className="quick-artwork__line" d="M31 25v15l12-7.5L31 25Z" />
          <path className="quick-artwork__spark" d="M49 10v8m-4-4h8M12 48v5m-2.5-2.5h5" />
          <circle className="quick-artwork__dot" cx="48" cy="43" r="3" />
        </svg>
      );
    case "favorite":
      return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 64 64">
          <path className="quick-artwork__heart" d="M32 49 14 32.5C3 21 20 8 32 22 44 8 61 21 50 32.5L32 49Z" />
          <path className="quick-artwork__spark" d="M51 12v8m-4-4h8M10 40v6m-3-3h6" />
          <circle className="quick-artwork__dot" cx="49" cy="44" r="3" />
        </svg>
      );
    case "file":
      return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 64 64">
          <path className="quick-artwork__sheet quick-artwork__sheet--back" d="M18 11h20l9 9v32H18V11Z" />
          <path className="quick-artwork__sheet" d="M12 16h20l9 9v28H12V16Z" />
          <path className="quick-artwork__line" d="M32 16v10h9m-22 8h14m-14 7h14m-14 7h9" />
          <path className="quick-artwork__spark" d="m48 11 1.6 3.4L53 16l-3.4 1.6L48 21l-1.6-3.4L43 16l3.4-1.6L48 11Z" />
        </svg>
      );
    case "video":
      return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 64 64">
          <rect className="quick-artwork__screen" height="36" rx="11" width="46" x="9" y="15" />
          <path className="quick-artwork__play" d="M28 24v18l15-9-15-9Z" />
          <path className="quick-artwork__spark" d="M48 9v7m-3.5-3.5h7M12 50v5m-2.5-2.5h5" />
        </svg>
      );
  }
}

export function QuickActions() {
  const [notice, setNotice] = useState("");

  function renderActionVisual(action: (typeof actions)[number]) {
    return (
      <span aria-hidden="true" className="home-quick-action__visual">
        <QuickActionArtwork name={action.artwork} />
      </span>
    );
  }

  return (
    <section aria-label="دسترسی سریع" className="home-quick-actions">
      <div className="home-quick-actions__rail">
        {actions.map((action) => action.href ? (
          <Link className="home-quick-action" href={action.href} key={action.label}>
            {renderActionVisual(action)}
            <span className="home-quick-action__label">{action.label}</span>
          </Link>
        ) : (
          <button
            aria-label={action.label}
            className="home-quick-action"
            key={action.label}
            onClick={() => setNotice(action.unavailable ?? "")}
            type="button"
          >
            {renderActionVisual(action)}
            <span className="home-quick-action__label">{action.label}</span>
          </button>
        ))}
      </div>
      {notice && (
        <div className="home-quick-actions__notice" role="status">
          <span>{notice}</span>
          <button aria-label="بستن پیام" onClick={() => setNotice("")} type="button"><HomeIcon name="close" /></button>
        </div>
      )}
    </section>
  );
}
