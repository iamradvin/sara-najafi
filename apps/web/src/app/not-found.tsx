import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container inner-page">
      <div className="page-intro">
        <div className="eyebrow">صفحه پیدا نشد</div>
        <h1>این مسیر <span>وجود ندارد.</span></h1>
        <Link className="button button--primary" href="/#top">بازگشت به خانه</Link>
      </div>
    </main>
  );
}
