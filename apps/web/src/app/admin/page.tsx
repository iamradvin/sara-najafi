import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { AdminDashboardData } from "@/components/admin-dashboard-data";

export const metadata = { title: "مدیریت | سارا نجفی" };

export default function AdminDashboardPage() {
  return (
    <DashboardShell type="admin">
      <section className="dashboard-welcome">
        <div>
          <div className="eyebrow">داشبورد مدیریت</div>
          <h1>نمای کلی <span>مجموعه.</span></h1>
          <p>آمار و فعالیت‌های مجموعه به‌صورت زنده از پایگاه داده دریافت می‌شوند.</p>
        </div>
        <Link className="button button--primary" href="/admin/courses">مدیریت دوره‌ها <span>←</span></Link>
      </section>
      <AdminDashboardData />
    </DashboardShell>
  );
}
