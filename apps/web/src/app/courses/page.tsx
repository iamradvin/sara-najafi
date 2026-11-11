import { CourseList } from "@/components/course-list";
import { PageLayout } from "@/components/site-shell";

export const metadata = {
  title: "دوره‌های تخصصی سارا نجفی",
  description: "دوره براشینگ مو تخصصی و دوره رنگ و لایت مو تخصصی با سارا نجفی.",
};

export default function CoursesPage() {
  return (
    <PageLayout>
      <section className="container inner-page">
        <div className="page-intro">
          <div className="eyebrow">دوره‌های تخصصی سارا نجفی</div>
          <h1>دوره‌های تخصصی <span>مو</span></h1>
          <p>دوره براشینگ مو تخصصی و دوره رنگ و لایت مو تخصصی را بررسی کن.</p>
        </div>
        <CourseList />
      </section>
    </PageLayout>
  );
}
