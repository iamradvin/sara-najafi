import Link from "next/link";
import Image from "next/image";
import { PageLayout } from "@/components/site-shell";
import { HomeHero } from "@/components/home-hero";
import { DashboardIcon } from "@/components/dashboard-icon";
import { ArticleCard } from "@/components/article-card";
import { articles } from "@/lib/articles";
import { HomeCourseSlider } from "@/components/home-course-slider";
import { QuickActions } from "@/components/home/quick-actions";
import { HomeIcon } from "@/components/home/home-icon";
import { AutoSlider } from "@/components/auto-slider";

const studentTestimonials = [
  { src: "/images/testimonials/hair-color-review.jpg", alt: "بازخورد هنرجو درباره نتیجه رنگ مو", width: 640, height: 1137 },
  { src: "/images/testimonials/brow-review.jpg", alt: "بازخورد مشتری درباره خدمات زیبایی ابرو", width: 640, height: 1137 },
  { src: "/images/testimonials/student-testimonials.jpg", alt: "مجموعه پیام‌های رضایت هنرجویان", width: 640, height: 1138 },
  { src: "/images/testimonials/hair-styling-review.jpg", alt: "بازخورد هنرجو درباره آموزش مو", width: 640, height: 1138 },
  { src: "/images/testimonials/student-work.jpg", alt: "بازخورد هنرجویان درباره نتیجه آموزش مو", width: 640, height: 1138 },
  { src: "/images/testimonials/student-chat.jpg", alt: "گفت‌وگوی هنرجو درباره آموزش", width: 590, height: 1280 },
] as const;

export default function HomePage() {
  return (
    <PageLayout showHeader={false}>
      <div className="home-page">
        <HomeHero />

        <section className="stats-strip container" id="features" aria-label="حوزه‌های آموزشی">
          <div><span className="stats-strip-icon"><DashboardIcon name="courses" /></span><small>رنگ مو</small></div>
          <div><span className="stats-strip-icon"><DashboardIcon name="path" /></span><small>لایت و بالیاژ</small></div>
          <div><span className="stats-strip-icon"><DashboardIcon name="video" /></span><small>کراتین و احیا</small></div>
          <div><span className="stats-strip-icon"><DashboardIcon name="start" /></span><small>مراقبت از مو</small></div>
          <p>از شناخت اصول تا اجرای تکنیک‌های تخصصی؛<br /><b>مسیر یادگیری زیبایی مو را آغاز کن.</b></p>
        </section>

        <QuickActions />

        <section className="section container home-courses-section" id="pricing">
          <div className="section-heading">
            <div><div className="eyebrow">براشینگ مو تخصصی و رنگ و لایت مو تخصصی</div><h2><HomeIcon name="courses" /><span className="home-heading-desktop">دوره‌های تخصصی <span>سارا نجفی</span></span><span className="home-heading-mobile">دوره‌های تخصصی سارا نجفی</span></h2></div>
            <Link className="text-link" href="/courses">بررسی دوره‌ها <span>←</span></Link>
          </div>
          <HomeCourseSlider />
          <Link className="lifestyle-free-promo instagram-promo" href="/contact">
            <span aria-hidden="true" className="lifestyle-free-promo__icon instagram-promo__icon">
              <svg fill="none" viewBox="0 0 24 24">
                <rect height="17" rx="5" width="17" x="3.5" y="3.5" />
                <circle cx="12" cy="12" r="4" />
                <circle className="instagram-promo__dot" cx="17.7" cy="6.8" r="1" />
              </svg>
            </span>
            <span className="lifestyle-free-promo__copy">
              <strong>راه‌های ارتباطی با سارا نجفی</strong>
              <span>برای اطلاع از آموزش‌های تخصصی زیبایی مو</span>
            </span>
            <span className="lifestyle-free-promo__cta">
              <span>تماس با ما</span>
              <span aria-hidden="true">←</span>
            </span>
          </Link>
        </section>

        <section className="section container home-articles-section" id="blog">
          <div className="section-heading">
            <div><div className="eyebrow">آموزش و آگاهی در زیبایی مو</div><h2><HomeIcon name="article" /><span className="home-heading-desktop">مجله تخصصی <span>زیبایی مو</span></span><span className="home-heading-mobile">مجله تخصصی زیبایی مو</span></h2></div>
            <Link className="text-link" href="/articles">همه مقاله‌ها <span>←</span></Link>
          </div>
          <AutoSlider
            className="home-card-slider"
            items={articles.map((article) => <ArticleCard article={article} key={article.slug} />)}
            label="مقاله‌های تخصصی زیبایی مو"
            mobileItemsPerPage={2}
            overlapOnMobile
            pageClassName="home-card-rail"
          />
        </section>

        <section aria-labelledby="testimonials-title" className="section container testimonials-section">
          <div className="section-heading testimonials-heading">
            <div>
              <div className="eyebrow">تجربه هنرجویان</div>
              <h2 id="testimonials-title"><HomeIcon name="testimonials" /><span>رضایت هنرجویان</span></h2>
            </div>
            <p>پیام‌ها و بازخوردهایی که هنرجویان با ما به اشتراک گذاشته‌اند.</p>
          </div>
          <div className="testimonials-carousel">
            <AutoSlider
              className="testimonials-slider"
              desktopItemsPerPage={4}
              hideControls
              items={studentTestimonials.map((testimonial, index) => {
                return (
                  <figure className="testimonial-card" key={testimonial.src}>
                    <span className="testimonial-card__image">
                      <Image
                        alt={testimonial.alt}
                        height={testimonial.height}
                        src={testimonial.src}
                        width={testimonial.width}
                      />
                    </span>
                    <figcaption className="testimonial-card__caption">
                      <span className="testimonial-card__mark" aria-hidden="true">✦</span>
                      <span>بازخورد هنرجویان</span>
                      <span className="testimonial-card__number">{(index + 1).toLocaleString("fa-IR")}</span>
                    </figcaption>
                  </figure>
                );
              })}
              label="تصاویر رضایت هنرجویان"
              mobileItemsPerPage={4}
              overlapOnMobile
              pageClassName="testimonials-rail"
              tabletItemsPerPage={4}
            />
          </div>
        </section>

        <section className="manifesto container" id="approach">
          <div className="manifesto-image manifesto-image--brand">
              <Image src="/images/sara-najafi.jpg" alt="سارا نجفی" fill sizes="(max-width: 680px) 100vw, 45vw" />
              <div className="image-caption"><span className="caption-line" />آموزش تخصصی زیبایی مو</div>
          </div>
          <div className="manifesto-copy">
              <div className="eyebrow">یادگیری با سارا نجفی</div>
              <h2>از علاقه به زیبایی<br />تا <span>تخصص حرفه‌ای</span></h2>
              <p>با آموزش تکنیک‌های تخصصی رنگ، لایت و احیای مو، مهارت‌های خودت را به سطح حرفه‌ای برسان.</p>
            <div className="manifesto-points">
                <div><span className="manifesto-point-icon"><DashboardIcon name="knowledge" /></span><p><strong>تکنیک‌های تخصصی رنگ و مش</strong><small>از شناخت پایه‌های رنگ تا اجرای لایت</small></p></div>
                <div><span className="manifesto-point-icon"><DashboardIcon name="lifestyle" /></span><p><strong>مراقبت و احیای مو</strong><small>آشنایی با کراتین، احیا و صافی مو</small></p></div>
            </div>
              <Link className="button button--outline" href="/courses">مشاهده دوره‌ها <span>←</span></Link>
          </div>
        </section>

        <section className="about-section container" id="contact">
          <div className="about-content">
            <div className="eyebrow">معرفی مدرس</div>
            <h2>سارا نجفی؛<br /><span>همراه مسیر حرفه‌ای تو</span></h2>
            <p>در مسیر یادگیری تکنیک‌های تخصصی زیبایی مو، با آموزش‌های کاربردی و حرفه‌ای همراهت هستیم.</p>
            <Link className="text-link" href="/about">آشنایی بیشتر <span>←</span></Link>
          </div>
          <div className="about-photo about-photo--brand"><Image src="/images/sara-najafi.jpg" alt="سارا نجفی" fill sizes="(max-width: 680px) 100vw, 40vw" /><span className="photo-number">آموزش تخصصی مو</span></div>
        </section>

        <section className="quote-band">
          <div className="container quote-inner">
            <span className="quote-mark">“</span>
            <p>از علاقه به زیبایی،<br /><strong>تا تخصص حرفه‌ای در زیبایی مو.</strong></p>
            <span className="quote-signature">— سارا نجفی</span>
          </div>
        </section>

        <section className="cta-section container">
          <div className="cta-card">
            <div className="cta-orb" aria-hidden="true" />
            <div className="eyebrow">مسیر یادگیری‌ات را آغاز کن</div>
            <h2>از کدام بخش <span>شروع می‌کنی؟</span></h2>
            <p>دوره‌های تخصصی رنگ مو، لایت، بالیاژ، کراتین و احیا را ببین.</p>
            <Link className="button button--primary" href="/courses">بررسی دوره‌ها <span>←</span></Link>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
