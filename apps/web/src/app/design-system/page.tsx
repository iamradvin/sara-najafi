import { PageLayout } from "@/components/site-shell";
import type { CSSProperties } from "react";

export const metadata = { title: "هویت بصری | سارا نجفی" };

const colors = [
  ["زرشکی تیره", "#200910"],
  ["رز بژ", "#BC9C8F"],
  ["پس‌زمینه", "#F8F3F0"],
  ["سطح", "#FFFFFF"],
  ["متن روشن", "#F7F1EF"],
  ["مرز", "#4B3035"],
];

export default function DesignSystemPage() {
  return (
    <PageLayout>
      <section className="container inner-page">
        <div className="page-intro">
          <div className="eyebrow">راهنمای هویت بصری</div>
          <h1>هویت <span>بصری</span></h1>
          <p>رنگ‌ها و اجزای بصری برند سارا نجفی با حفظ ساختار رابط کاربری.</p>
        </div>
        <section className="design-block">
          <h2>رنگ‌های برند</h2>
          <div className="swatches">
            {colors.map(([name, value]) => (
              <div key={name}>
                <span style={{ "--swatch": value } as CSSProperties} />
                <strong>{name}</strong>
                <small>{value}</small>
              </div>
            ))}
          </div>
        </section>
        <section className="design-block">
          <h2>تایپوگرافی فارسی · Peyda</h2>
          <div className="type-specimen">
            <span>نمایش / ۶۴</span>
            <strong>آگاهانه انتخاب کن</strong>
            <p>خودت را بهتر بشناس، اولویتت را روشن کن و برای قدم بعدی تصمیم بگیر.</p>
            <small>متن کمکی و توضیحات · ۱۴</small>
          </div>
        </section>
        <section className="design-block">
          <h2>اجزای رابط</h2>
          <div className="component-showcase">
            <button className="button button--primary" type="button">دکمه اصلی <span>←</span></button>
            <button className="button button--outline" type="button">دکمه ثانویه</button>
            <span className="pill">آموزش کاربردی</span>
            <span className="pill pill--muted">یادگیری مرحله‌به‌مرحله</span>
          </div>
        </section>
      </section>
    </PageLayout>
  );
}
