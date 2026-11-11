import { PageLayout } from "@/components/site-shell";

export const metadata = { title: "تماس با ما | سارا نجفی" };

export default function ContactPage() {
  return (
    <PageLayout>
      <section className="container inner-page">
        <div className="page-intro">
          <div className="eyebrow">راه‌های ارتباطی</div>
          <h1>تماس با <span>سارا نجفی</span></h1>
          <p>راه‌های ارتباطی پس از دریافت اطلاعات رسمی برند در این بخش قرار می‌گیرند.</p>
        </div>
        <div aria-label="راه‌های تماس" className="contact-methods">
          <div className="contact-method">
            <span aria-hidden="true" className="contact-method__icon">
              <svg fill="none" viewBox="0 0 24 24"><path d="M7.2 3.5h2.1l1.5 4-2 1.8a15 15 0 0 0 5.9 5.9l1.8-2 4 1.5v2.1a2 2 0 0 1-2.2 2C10.7 18 6 13.3 5.2 5.7a2 2 0 0 1 2-2.2Z" /></svg>
            </span>
            <span><small>تماس تلفنی</small><strong>اطلاعات تماس به‌زودی اعلام می‌شود</strong></span>
          </div>
          <div className="contact-method">
            <span aria-hidden="true" className="contact-method__icon">
              <svg fill="none" viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.8" r=".8" fill="currentColor" stroke="none" /></svg>
            </span>
            <span><small>اینستاگرام</small><strong>نشانی رسمی هنوز ثبت نشده است</strong></span>
          </div>
          <div className="contact-method">
            <span aria-hidden="true" className="contact-method__icon">
              <svg fill="none" viewBox="0 0 24 24"><path d="m21 3-6.8 18-3.8-7.4L3 10.2 21 3Z" /><path d="m10.4 13.6 4.7-4.7" /></svg>
            </span>
            <span><small>پیام‌رسان</small><strong>اطلاعات ارتباطی هنوز ثبت نشده است</strong></span>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
