import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { StudentDashboardData } from "@/components/student-data";

export const metadata = { title: "فضای یادگیری | سارا نجفی" };

export default function StudentDashboardPage() {
  return (
    <DashboardShell type="student">
      <section className="dashboard-welcome">
        <div>
          <div className="eyebrow">فضای یادگیری تو</div>
          <h1>مسیرت را <span>با آگاهی ادامه بده.</span></h1>
          <p>دوره‌ها و پیشرفتت را ببین و قدم بعدی را متناسب با هدفت انتخاب کن.</p>
        </div>
        <Link className="button button--primary" href="/courses">بررسی دوره‌ها <span>←</span></Link>
      </section>
      <StudentDashboardData />
    </DashboardShell>
  );
}
