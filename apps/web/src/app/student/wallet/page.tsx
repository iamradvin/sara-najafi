import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";

export const metadata = { title: "کیف پول | سارا نجفی" };

export default function StudentWalletPage() {
  return (
    <DashboardShell type="student">
      <section className="dashboard-welcome">
        <div>
          <div className="eyebrow">حساب کاربری</div>
          <h1>کیف پول</h1>
          <p>وضعیت اعتبار کیف پول در این صفحه نمایش داده می‌شود.</p>
        </div>
      </section>
      <section className="dashboard-empty" aria-labelledby="wallet-unavailable-title">
        <strong id="wallet-unavailable-title">کیف پول هنوز به سامانه متصل نشده است</strong>
        <p>در حال حاضر API موجودی یا شارژ کیف پول در پروژه وجود ندارد. برای دیدن سوابق خرید، سفارش‌ها را بررسی کن.</p>
        <Link className="text-link" href="/student/orders">رفتن به سفارش‌ها <span>←</span></Link>
      </section>
    </DashboardShell>
  );
}
