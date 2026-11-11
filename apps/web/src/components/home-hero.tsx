"use client";

import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-shell";
import { HeroSlider } from "@/components/home/hero-slider";
import { AutoSlider } from "@/components/auto-slider";

const heroImages = [
  { src: "/images/home-slider/haircut.jpg", alt: "آموزش تخصصی کوتاهی مو" },
  { src: "/images/home-slider/brushing.jpg", alt: "دوره براشینگ مو تخصصی" },
  { src: "/images/home-slider/color-light.jpg", alt: "دوره رنگ و لایت مو تخصصی" },
] as const;

export function HomeHero() {
  return (
    <section className="attractory-hero relative isolate overflow-hidden" dir="rtl" id="top">
      <HeroSlider />
      <div aria-hidden="true" className="attractory-hero-background pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="hero-ambient-glow hero-ambient-glow--top absolute -right-36 -top-40 h-[30rem] w-[30rem]" />
        <div className="hero-ambient-glow hero-ambient-glow--bottom absolute -bottom-48 -left-32 h-[28rem] w-[34rem]" />
        <span className="hero-star absolute right-[14%] top-[18%] h-1 w-1 rounded-full bg-[#bc9c8f] shadow-[0_0_12px_3px_rgba(188,156,143,.65)]" />
        <span className="hero-star absolute right-[33%] top-[11%] h-0.5 w-0.5 rounded-full bg-white shadow-[0_0_10px_2px_rgba(255,255,255,.6)]" />
        <span className="hero-star absolute left-[22%] top-[24%] h-1 w-1 rounded-full bg-[#bc9c8f] shadow-[0_0_12px_3px_rgba(188,156,143,.55)]" />
        <span className="hero-star absolute left-[38%] top-[9%] h-0.5 w-0.5 rounded-full bg-white shadow-[0_0_10px_2px_rgba(255,255,255,.6)]" />
        <span className="hero-star absolute left-[9%] top-[39%] h-0.5 w-0.5 rounded-full bg-white shadow-[0_0_10px_2px_rgba(255,255,255,.5)]" />
      </div>

      <SiteHeader />

      <div className="hero hero-desktop container attractory-hero-content">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" />آموزش تخصصی زیبایی مو با سارا نجفی</div>
          <h1>از علاقه به زیبایی<br /><span>تا تخصص حرفه‌ای</span></h1>
          <p className="hero-lead">با آموزش تکنیک‌های تخصصی رنگ، لایت و احیای مو، مهارت‌های خودت را به سطح حرفه‌ای برسان.</p>
          <div className="hero-actions">
            <Link className="button button--primary" href="/courses">
              مشاهده دوره‌های آموزشی
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M19 12H5m0 0 7 7m-7-7 7-7" /></svg>
            </Link>
            <Link className="text-link" href="/about"><span className="play-icon" aria-hidden="true"><svg viewBox="0 0 12 12"><path d="M4 2.25v7.5L10 6 4 2.25Z" /></svg></span> آشنایی با آموزش‌ها</Link>
          </div>
          <div className="hero-proof">
            <div className="avatar-stack" aria-hidden="true"><Image src="/images/sara-najafi.jpg" alt="" width={35} height={35} /></div>
            <div><strong>آموزش‌های تخصصی سارا نجفی</strong><small>رنگ، لایت و مراقبت از مو</small></div>
            <div className="proof-divider" />
            <div className="rating"><strong>۶ حوزه</strong><small>از رنگ مو تا احیا</small></div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-orbit hero-orbit--one" />
          <div className="hero-orbit hero-orbit--two" />
          <AutoSlider
            className="hero-image-slider"
            desktopItemsPerPage={1}
            hideControls
            items={heroImages.map((image, index) => (
              <div className="hero-image-frame hero-image-frame--brand" key={image.src}>
                <Image
                  alt={image.alt}
                  fill
                  priority={index === 0}
                  sizes="(max-width: 900px) 90vw, 42vw"
                  src={image.src}
                />
              </div>
            ))}
            label="تصاویر دوره‌های سارا نجفی"
            mobileItemsPerPage={1}
            pageClassName="hero-image-rail"
            tabletItemsPerPage={1}
          />
        </div>
        <div className="hero-scroll"><span />کمی پایین‌تر</div>
      </div>
    </section>
  );
}
