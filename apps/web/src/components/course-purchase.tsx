"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";
import { formatTomanAmount } from "@/lib/format-price";

type CoursePrice = { isFree: boolean; priceToman: number | null };
type ApiMessage = { message?: string | string[] };
type CheckoutResult =
  | { type: "payment"; paymentUrl: string }
  | { type: "enrolled"; courseSlugs: string[] };

function messageFrom(payload: ApiMessage, fallback: string): string {
  if (Array.isArray(payload.message)) return payload.message[0] ?? fallback;
  return payload.message ?? fallback;
}

export function CoursePurchase({ slug }: Readonly<{ slug: string }>) {
  const router = useRouter();
  const [course, setCourse] = useState<CoursePrice | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(apiUrl(`/courses/${encodeURIComponent(slug)}`), { signal: controller.signal })
      .then(async (response) => {
        const payload = (await response.json()) as CoursePrice & ApiMessage;
        if (!response.ok) throw new Error(messageFrom(payload, "اطلاعات دوره دریافت نشد."));
        setCourse(payload);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError("ارتباط با سرور برقرار نشد؛ قیمت دوره در دسترس نیست.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [slug]);

  async function startCheckout() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(apiUrl("/checkout"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseSlugs: [slug] }),
      });
      const payload = (await response.json()) as CheckoutResult & ApiMessage;
      if (!response.ok) {
        if (response.status === 401) {
          router.push(`/login?next=${encodeURIComponent(`/courses/${slug}`)}`);
          return;
        }
        throw new Error(messageFrom(payload, "شروع فرایند ثبت‌نام انجام نشد."));
      }
      if (payload.type === "payment") {
        location.assign(payload.paymentUrl);
        return;
      }
      router.push("/student/courses");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "ارتباط با سرور برقرار نشد.");
    } finally {
      setBusy(false);
    }
  }

  const canPurchase = Boolean(course && (
    course.isFree || (course.priceToman !== null && course.priceToman > 0)
  ));

  return (
    <>
      <div className="price" aria-live="polite">
        {loading ? <strong className="price-pending">در حال دریافت قیمت…</strong> : course?.isFree ? (
          <strong>رایگان</strong>
        ) : course?.priceToman !== null && course?.priceToman !== undefined && course.priceToman > 0 ? (
          <strong>{formatTomanAmount(course.priceToman)} <small>تومان</small></strong>
        ) : (
          <strong className="price-pending">قیمت اعلام نشده</strong>
        )}
      </div>
      {canPurchase ? (
        <button className="button button--primary" disabled={busy || loading} onClick={startCheckout} type="button">
          {busy ? "در حال انتقال…" : course?.isFree ? "ثبت‌نام رایگان" : "ادامه به پرداخت"}
        </button>
      ) : (
        <button className="button button--primary" disabled type="button">ثبت‌نام در دسترس نیست</button>
      )}
      <p>{error || (course?.isFree ? "برای ثبت‌نام رایگان، ابتدا وارد حساب کاربری شو." : "پرداخت امن از طریق درگاه زرین‌پال انجام می‌شود.")}</p>
      {!course?.isFree && !loading && (course?.priceToman == null || course.priceToman < 1) && !error && (
        <p>مدیر دوره هنوز قیمت را تعیین نکرده است.</p>
      )}
    </>
  );
}
