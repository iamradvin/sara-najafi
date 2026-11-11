"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { DashboardIcon, type DashboardIconName } from "@/components/dashboard-icon";
import { BrandLogo } from "@/components/brand-logo";
import { apiUrl } from "@/lib/api";

type DashboardLink = { href: string; label: string; icon: DashboardIconName };
type SessionUser = { id: string; email: string | null; name: string; roles: string[] };

const navigation: Record<"student" | "admin", DashboardLink[]> = {
  student: [
    { href: "/student", label: "نمای کلی", icon: "overview" },
    { href: "/student/courses", label: "دوره‌های من", icon: "courses" },
    { href: "/student/orders", label: "سفارش‌ها", icon: "orders" },
    { href: "/student/profile", label: "پروفایل", icon: "profile" },
  ],
  admin: [
    { href: "/admin", label: "نمای کلی", icon: "overview" },
    { href: "/admin/courses", label: "مدیریت دوره‌ها", icon: "courses" },
    { href: "/admin/categories", label: "دسته‌بندی‌ها", icon: "categories" },
    { href: "/admin/enrollments", label: "ثبت‌نام‌ها", icon: "enrollments" },
    { href: "/admin/instructors", label: "مدرسان", icon: "students" },
    { href: "/admin/students", label: "دانشجوها", icon: "students" },
    { href: "/admin/orders", label: "سفارش‌ها", icon: "orders" },
  ],
};

export function DashboardShell({
  type,
  children,
}: Readonly<{ type: "student" | "admin"; children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const sidebarId = useId();
  const sidebarRef = useRef<HTMLElement>(null);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authState, setAuthState] = useState<"loading" | "ready" | "error">("loading");
  const [authRetry, setAuthRetry] = useState(0);
  const [logoutError, setLogoutError] = useState(false);
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const isInstructor = Boolean(currentUser?.roles.includes("INSTRUCTOR") && !currentUser.roles.includes("SUPER_ADMIN"));
  const title = type === "admin" ? isInstructor ? "پنل مدرس" : "مدیریت" : "فضای یادگیری";
  const links = type === "admin" && isInstructor
    ? navigation.admin.filter((link) => ["/admin", "/admin/courses"].includes(link.href))
    : navigation[type];
  const isCurrentLink = (href: string) =>
    pathname === href || (href !== `/${type}` && pathname.startsWith(`${href}/`));

  useEffect(() => {
    let active = true;
    fetch(apiUrl(type === "admin" ? "/auth/admin-check" : "/auth/student-check"), {
      credentials: "include",
      cache: "no-store",
    })
      .then(async (response) => {
        if (response.status === 401) {
          const next = encodeURIComponent(pathname);
          if (active) router.replace(`/login?next=${next}`);
          return;
        }
        if (response.status === 403 && type === "admin") {
          if (active) setAuthState("error");
          return;
        }
        if (!response.ok) throw new Error("Authentication check failed");
        const user = (await response.json()) as SessionUser;
        if (active) {
          setCurrentUser(user);
          setAuthState("ready");
        }
      })
      .catch(() => {
        if (active) setAuthState("error");
      });

    return () => {
      active = false;
    };
  }, [authRetry, pathname, router, type]);

  useEffect(() => {
    function updateProfile(event: Event) {
      const detail = (event as CustomEvent<{ name?: string }>).detail;
      const name = detail?.name;
      if (name) setCurrentUser((user) => user ? { ...user, name } : user);
    }
    window.addEventListener("attractory:profile-updated", updateProfile);
    return () => window.removeEventListener("attractory:profile-updated", updateProfile);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sidebarRef.current?.querySelector<HTMLElement>("a[href]")?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuToggleRef.current?.focus();
        return;
      }

      if (event.key === "Tab" && sidebarRef.current) {
        const focusable = sidebarRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  async function signOut() {
    setLogoutError(false);
    try {
      const response = await fetch(apiUrl("/auth/logout"), {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Sign out failed");
      router.replace("/login");
    } catch {
      setLogoutError(true);
    }
  }

  return (
    <div className={`dashboard dashboard--${type}`}>
      {menuOpen && (
        <button
          aria-label="بستن منو"
          className="dashboard-backdrop"
          onClick={() => {
            setMenuOpen(false);
            menuToggleRef.current?.focus();
          }}
          type="button"
        />
      )}
      <aside
        aria-label={menuOpen ? `منوی ${title}` : undefined}
        aria-modal={menuOpen ? true : undefined}
        className={`dashboard-sidebar${menuOpen ? " is-open" : ""}`}
        id={sidebarId}
        ref={sidebarRef}
        role={menuOpen ? "dialog" : undefined}
      >
        <Link className="dashboard-brand" href="/#top">
          <BrandLogo size={42} />
          <span><small>{title}</small></span>
        </Link>
        <span className="dashboard-nav-label">منوی اصلی</span>
        <nav className="dashboard-nav" aria-label={`منوی ${title}`}>
          {links.map((link) => (
            <Link
              aria-current={isCurrentLink(link.href) ? "page" : undefined}
              className={`dashboard-nav-link${isCurrentLink(link.href) ? " is-active" : ""}`}
              href={link.href}
              key={link.href}
              onClick={() => setMenuOpen(false)}
            >
              <span className="dashboard-nav-icon"><DashboardIcon name={link.icon} /></span>
              {link.label}
            </Link>
          ))}
        </nav>
        <Link className="dashboard-back-home" href="/#top">← بازگشت به سایت</Link>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-header">
          <button
            aria-expanded={menuOpen}
            aria-controls={sidebarId}
            aria-label={menuOpen ? "بستن منو" : "باز کردن منو"}
            className="menu-toggle dashboard-menu-toggle"
            ref={menuToggleRef}
            onClick={() => setMenuOpen(!menuOpen)}
            type="button"
          >
            <span />
            <span />
          </button>
          <div className="dashboard-heading">
            <span>{title}</span>
            <strong>سلام، {currentUser?.name}</strong>
          </div>
          <span className="connection-status"><span /> اتصال به سامانه</span>
          <ThemeToggle />
          <button className="dashboard-logout" onClick={signOut} type="button">خروج</button>
          <div className="dashboard-avatar" aria-label={`حساب ${currentUser?.name}`}>
            {currentUser?.name.trim().charAt(0)}
          </div>
        </header>
        <main className="dashboard-content">
          {logoutError && (
            <p className="auth-error" role="alert">خروج از حساب انجام نشد؛ اتصال به سرور را بررسی کن.</p>
          )}
          {authState === "loading" ? (
            <div className="dashboard-auth-state" role="status">در حال بررسی نشست کاربری…</div>
          ) : authState === "error" ? (
            <div className="dashboard-auth-state dashboard-auth-state--error" role="alert">
              {type === "admin"
                ? "این حساب دسترسی مدیریت ندارد یا سرویس ورود در دسترس نیست."
                : "سرویس ورود در دسترس نیست. لطفاً بعداً دوباره تلاش کن."}
              <Link className="text-link" href={type === "admin" ? "/student" : "/login"}>
                {type === "admin" ? "رفتن به فضای یادگیری" : "رفتن به صفحه ورود"} <span>←</span>
              </Link>
              <button
                className="button button--outline button--small"
                onClick={() => {
                  setAuthState("loading");
                  setAuthRetry((count) => count + 1);
                }}
                type="button"
              >
                تلاش دوباره
              </button>
            </div>
          ) : (
            <>
              {children}
            </>
          )}
        </main>
        <footer className="dashboard-footer">
          © ۲۰۲۶ سارا نجفی <span>آموزش تخصصی زیبایی مو ✳</span>
        </footer>
      </div>
      <MobileBottomNav />
    </div>
  );
}
