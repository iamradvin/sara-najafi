"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { MobileHomeHeader } from "@/components/home/mobile-home-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { PwaInstallButton } from "@/components/pwa-install-button";

export function SiteHeader({ hideOnScroll = true }: Readonly<{ hideOnScroll?: boolean }>) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(false);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuToggleRef.current?.focus();
        return;
      }

      if (event.key === "Tab") {
        const focusableElements = menuRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])',
        );
        if (!focusableElements?.length) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }

    menuRef.current?.querySelector<HTMLElement>("a[href]")?.focus();
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
    menuToggleRef.current?.focus();
  }

  useEffect(() => {
    if (!hideOnScroll || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let previousY = window.scrollY;
    function handleScroll() {
      const currentY = window.scrollY;
      const difference = currentY - previousY;
      if (currentY <= 80) setHeaderHidden(false);
      else if (Math.abs(difference) > 6) setHeaderHidden(!menuOpen && difference > 0);
      previousY = currentY;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hideOnScroll, menuOpen]);

  return (
    <header
      className={`site-header${headerHidden && !menuOpen ? " is-hidden" : ""}${menuOpen ? " is-menu-open" : ""}`}
    >
      <Link className="brand" href="/#top" aria-label="سارا نجفی، صفحه اصلی">
        <BrandLogo size={52} />
      </Link>
      <button
        aria-expanded={menuOpen}
        aria-label={menuOpen ? "بستن منو" : "باز کردن منو"}
        aria-controls="primary-navigation"
        className="menu-toggle"
        ref={menuToggleRef}
        onClick={() => setMenuOpen(!menuOpen)}
        type="button"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
          {menuOpen ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      <button
        aria-hidden={!menuOpen}
        aria-label="بستن منو"
        className={`mobile-nav-backdrop${menuOpen ? " is-open" : ""}`}
        onClick={closeMenu}
        tabIndex={-1}
        type="button"
      />
      <nav
        aria-label="ناوبری اصلی"
        className={`main-nav${menuOpen ? " is-open" : ""}`}
        id="primary-navigation"
        ref={menuRef}
      >
        <div className="mobile-nav-heading">
          <div>
            <small>سارا نجفی</small>
            <span>مسیرت را انتخاب کن</span>
          </div>
          <button
            aria-label="بستن منو"
            className="mobile-nav-close"
            onClick={closeMenu}
            type="button"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        {[
          { href: "/#top", label: "خانه" },
          { href: "/courses", label: "دوره‌ها" },
          { href: "/articles", label: "مقاله‌ها" },
          { href: "/about", label: "معرفی مدرس" },
        ].map((item, index) => {
          const active = item.href.startsWith("/#") ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`nav-link${active ? " is-active" : ""}`}
              href={item.href}
              key={item.href}
              onClick={() => setMenuOpen(false)}
            >
              <span className="mobile-nav-number">{String(index + 1).padStart(2, "0")}</span>
              <span>{item.label}</span>
              <span aria-hidden="true" className="mobile-nav-arrow">↗</span>
            </Link>
          );
        })}
        <div className="mobile-nav-footer">
          <span>آموزش تخصصی زیبایی مو</span>
          <Link href="/login" onClick={() => setMenuOpen(false)}>ورود / ثبت‌نام</Link>
        </div>
      </nav>
      <div className="header-actions">
        <ThemeToggle />
        <Link
          aria-label="ورود / ثبت‌نام"
          className="button button--small button--outline header-login"
          href="/login"
          title="ورود / ثبت‌نام"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
            <path d="M15 20v-1.5a4.5 4.5 0 0 0-4.5-4.5h-3A4.5 4.5 0 0 0 3 18.5V20m6-9a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm9-3v6m-3-3h6" />
          </svg>
          <span>ورود / ثبت‌نام</span>
        </Link>
        <PwaInstallButton variant="desktop" />
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div className="footer-brand">
          <Link aria-label="سارا نجفی، صفحه اصلی" className="brand" href="/#top">
            <BrandLogo size={64} />
          </Link>
          <p>آموزش تخصصی رنگ مو، لایت، بالیاژ، کراتین و احیای مو.</p>
        </div>
        <div className="footer-links">
          <strong>دسترسی سریع</strong>
          <Link href="/#top">خانه</Link>
          <Link href="/courses">دوره‌ها</Link>
          <Link href="/articles">مقاله‌ها</Link>
          <Link href="/about">معرفی مدرس</Link>
          <Link href="/login">ورود / ثبت‌نام</Link>
        </div>
        <div className="footer-links">
          <strong>آموزش و آشنایی بیشتر</strong>
          <span>دوره‌ها و مقاله‌های تخصصی زیبایی مو را دنبال کن.</span>
          <Link href="/design-system">هویت بصری برند</Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© ۲۰۲۶ سارا نجفی — همه‌ی حقوق محفوظ است.</span>
        <span>برای یادگیری تخصصی زیبایی مو <b>✳</b></span>
      </div>
    </footer>
  );
}

export function PageLayout({
  children,
  showHeader = true,
}: Readonly<{ children: React.ReactNode; showHeader?: boolean }>) {
  return (
    <>
      <div className="page-glow page-glow--top" aria-hidden="true" />
      <MobileHomeHeader />
      {showHeader && <SiteHeader />}
      <main>{children}</main>
      <SiteFooter />
      <MobileBottomNav />
      <ThemeToggle iconOnly />
    </>
  );
}
