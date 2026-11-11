"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";

const banners = [
  {
    title: "آموزش کوتاهی مو تخصصی",
    image: "/images/home-slider/haircut.jpg",
  },
  {
    title: "دوره براشینگ مو تخصصی",
    image: "/images/home-slider/brushing.jpg",
  },
  {
    title: "دوره رنگ و لایت مو تخصصی",
    image: "/images/home-slider/color-light.jpg",
  },
] as const;

export function HeroSlider() {
  const enabled = useMediaQuery("(max-width: 680px)");
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  useEffect(() => {
    if (!enabled || reducedMotion) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        setActiveIndex((index) => (index + 1) % banners.length);
      }
    }, 5_000);
    return () => window.clearInterval(timer);
  }, [enabled, reducedMotion]);

  const activeBanner = banners[activeIndex]!;

  return (
    <section
      aria-label="دوره‌های پیشنهادی"
      aria-roledescription="اسلایدر"
      className="home-banner-slider"
      onTouchStart={(event) => setTouchStart(event.touches[0]?.clientX ?? null)}
      onTouchEnd={(event) => {
        if (touchStart === null) return;
        const end = event.changedTouches[0]?.clientX;
        setTouchStart(null);
        if (end === undefined || Math.abs(end - touchStart) < 40) return;
        setActiveIndex((index) => (index + (end > touchStart ? 1 : -1) + banners.length) % banners.length);
      }}
    >
      <article className="home-banner home-banner--image" key={activeBanner.title}>
        <Link aria-label={`مشاهده ${activeBanner.title}`} className="home-banner__full-link" href="/courses">
          <Image
            alt={activeBanner.title}
            className="home-banner__image"
            fill
            priority
            sizes="(max-width: 680px) 100vw, 680px"
            src={activeBanner.image}
          />
        </Link>
      </article>
      <div className="home-banner-dots" role="group" aria-label="انتخاب بنر">
        {banners.map((banner, index) => (
          <button
            aria-current={activeIndex === index ? "true" : undefined}
            aria-label={`نمایش بنر ${index + 1}: ${banner.title}`}
            className={activeIndex === index ? "is-active" : ""}
            key={banner.title}
            onClick={() => setActiveIndex(index)}
            type="button"
          />
        ))}
      </div>
      <Link className="lifestyle-free-promo" href="/courses">
        <span aria-hidden="true" className="lifestyle-free-promo__icon">
          <svg fill="none" viewBox="0 0 24 24">
            <path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H17a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7.5A2.5 2.5 0 0 1 5 17.5v-13Z" />
            <path d="M5 5h12m-8 4h7m-7 3h7m-7 3h4" />
            <path className="lifestyle-free-promo__sparkle" d="m19 1 .8 1.7 1.7.8-1.7.8L19 6l-.8-1.7-1.7-.8 1.7-.8L19 1Z" />
          </svg>
        </span>
        <span className="lifestyle-free-promo__copy">
          <strong>دوره‌های تخصصی زیبایی مو</strong>
          <span>رنگ، لایت، بالیاژ، کراتین و احیای مو</span>
        </span>
        <span className="lifestyle-free-promo__cta">
          <span>مشاهده دوره‌ها</span>
          <span aria-hidden="true">←</span>
        </span>
      </Link>
    </section>
  );
}

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
