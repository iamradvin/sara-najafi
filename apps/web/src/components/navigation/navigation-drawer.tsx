"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { HomeIcon } from "@/components/home/home-icon";
import { navigationSections, unavailableNavigationMessages } from "@/components/navigation/navigation-data";
import { apiUrl, courseImageUrl } from "@/lib/api";

type Profile = {
  name: string;
  avatarUrl: string | null;
};

type ProfileState = "loading" | "guest" | "ready" | "error";

export function NavigationDrawer({
  open,
  onClose,
  triggerRef,
}: Readonly<{
  open: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}>) {
  const drawerRef = useRef<HTMLElement>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileState, setProfileState] = useState<ProfileState>("loading");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    void fetch(apiUrl("/auth/profile"), {
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.status === 401) {
          if (!controller.signal.aborted) setProfileState("guest");
          return;
        }
        if (!response.ok) throw new Error("Profile request failed.");
        const account = (await response.json()) as Profile;
        if (controller.signal.aborted) return;
        setProfile(account);
        setProfileState("ready");
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        if (!controller.signal.aborted) setProfileState("error");
      });

    return () => controller.abort();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawerRef.current?.querySelector<HTMLElement>("button, a[href]")?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        triggerRef.current?.focus();
        return;
      }

      if (event.key !== "Tab" || !drawerRef.current) return;
      const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled])',
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

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose, triggerRef]);

  function closeDrawer() {
    onClose();
    triggerRef.current?.focus();
  }

  return (
    <>
      <button
        aria-hidden={!open}
        aria-label="بستن منو"
        className={`home-drawer-backdrop${open ? " is-open" : ""}`}
        onClick={closeDrawer}
        tabIndex={open ? 0 : -1}
        type="button"
      />
      <aside
        aria-label="منوی اصلی"
        aria-modal={open ? true : undefined}
        className={`navigation-drawer${open ? " is-open" : ""}`}
        ref={drawerRef}
        role={open ? "dialog" : undefined}
      >
        <div className="navigation-drawer__profile">
          <button aria-label="بستن منو" className="navigation-drawer__close" onClick={closeDrawer} type="button">
            <HomeIcon name="close" />
          </button>
          <div className="navigation-drawer__avatar">
            {profile?.avatarUrl ? (
              <Image alt="" fill sizes="76px" src={courseImageUrl(profile.avatarUrl)} unoptimized />
            ) : (
              <HomeIcon name="profile" />
            )}
          </div>
          <div className="navigation-drawer__name" aria-live="polite">
            {profileState === "loading" ? "در حال بررسی حساب…" : null}
            {profileState === "guest" ? "کاربر مهمان" : null}
            {profileState === "ready" ? profile?.name : null}
            {profileState === "error" ? "اطلاعات حساب در دسترس نیست" : null}
          </div>
          {profileState === "guest" && (
            <Link className="navigation-drawer__login" href="/login" onClick={onClose}>ورود / ثبت‌نام</Link>
          )}
        </div>

        <div className="navigation-drawer__sections">
          {navigationSections.map((section) => (
            <section className="navigation-section" key={section.title}>
              <h2><HomeIcon name={section.icon} /><span>{section.title}</span></h2>
              <div className="navigation-section__items">
                {section.items.map((item) => {
                  const isAccountLink = section.title === "اطلاعات شخصی" && item.href === "/login";
                  const href = isAccountLink && profileState === "ready" ? "/student/profile" : item.href;
                  const label = isAccountLink && profileState === "ready" ? "پروفایل" : item.label;

                  return href ? (
                    <Link className="navigation-item" href={href} key={item.label} onClick={onClose}>
                      <span>{label}</span>
                      <HomeIcon name="chevron" />
                    </Link>
                  ) : (
                    <button
                      className="navigation-item"
                      key={item.label}
                      onClick={() => setNotice(item.unavailable ? unavailableNavigationMessages[item.unavailable] : "")}
                      type="button"
                    >
                      <span>{label}</span>
                      <HomeIcon name="chevron" />
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
          {notice && <p className="navigation-drawer__notice" role="status">{notice}</p>}
        </div>
      </aside>
    </>
  );
}
