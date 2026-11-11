"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type BottomNavIconName = "home" | "courses" | "article" | "profile" | "support";

function BottomNavIcon({ name }: Readonly<{ name: BottomNavIconName }>) {
  const shared = {
    "aria-hidden": true as const,
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2,
    viewBox: "0 0 24 24",
  };

  switch (name) {
    case "home":
      return <svg {...shared}><path d="m3.5 10 8.5-7 8.5 7M5.5 9v11h13V9M9.5 20v-6h5v6" /></svg>;
    case "courses":
      return <svg {...shared}><rect x="3.5" y="5" width="17" height="14" rx="3" /><path d="m10 9 5 3-5 3V9Z" /></svg>;
    case "article":
      return <svg {...shared}><path d="M6 3.5h9l4 4V20H6V3.5Z" /><path d="M14.5 3.5v5h5M9 12h7m-7 4h7" /></svg>;
    case "profile":
      return <svg {...shared}><circle cx="12" cy="8" r="3" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></svg>;
    case "support":
      return <svg {...shared}><path d="M4 13v-2a8 8 0 0 1 16 0v2" /><rect x="3.5" y="12" width="4" height="7" rx="2" /><rect x="16.5" y="12" width="4" height="7" rx="2" /></svg>;
  }
}

const items = [
  { href: "/#top", label: "صفحه اصلی", icon: "home" },
  { href: "/courses", label: "دوره‌ها", icon: "courses" },
  { href: "/articles", label: "مقاله‌ها", icon: "article" },
  { href: "/student/profile", label: "پروفایل", icon: "profile" },
  { href: "/contact", label: "پشتیبانی", icon: "support" },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="ناوبری پایین" className="mobile-bottom-nav">
      {items.map((item) => {
        const active = item.href === "/#top"
          ? pathname === "/"
          : item.href === "/articles"
            ? pathname.startsWith("/articles")
          : item.href === "/contact"
            ? pathname.startsWith("/contact") || pathname.startsWith("/about")
            : item.href === "/courses"
              ? pathname.startsWith("/courses")
              : pathname.startsWith("/student") || pathname.startsWith("/admin");

        return (
          <Link
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            className={`mobile-bottom-nav__link${active ? " is-active" : ""}`}
            href={item.href}
            key={item.href}
          >
            <BottomNavIcon name={item.icon} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
