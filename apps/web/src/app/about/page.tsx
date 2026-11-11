import Image from "next/image";
import { PageLayout } from "@/components/site-shell";

export const metadata = {
  title: "معرفی مدرس | سارا نجفی",
  description: "آشنایی با آموزش‌های تخصصی رنگ مو، لایت، بالیاژ و احیای مو با سارا نجفی.",
};

export default function AboutPage() {
  return (
    <PageLayout>
      <section className="container inner-page about-page">
        <div className="about-content">
          <div className="eyebrow">آموزش‌های سارا نجفی</div>
          <h1>سارا نجفی؛<br /><span>همراه مسیر حرفه‌ای تو</span></h1>
          <p>در مسیر یادگیری تکنیک‌های تخصصی زیبایی مو، با آموزش‌های کاربردی و حرفه‌ای همراهت هستیم.</p>
          <p>حوزه‌های آموزشی شامل رنگ مو، رنگ و مش، لایت، بالیاژ و آمبره، کراتین، احیا و صافی و تکنیک‌های مراقبت از مو است.</p>
        </div>
        <div className="about-photo about-photo--brand">
          <Image src="/images/sara-najafi.jpg" alt="سارا نجفی" fill sizes="(max-width: 680px) 100vw, 40vw" />
          <span className="photo-number">آموزش تخصصی زیبایی مو</span>
        </div>
      </section>
    </PageLayout>
  );
}
