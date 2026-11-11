"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";
import { formatTomanAmount } from "@/lib/format-price";

type Order = {
  orderNumber: string;
  status: "PENDING" | "PAID" | "CANCELLED";
  totalToman: number;
};
type ApiMessage = { message?: string | string[] };

function errorText(payload: ApiMessage): string {
  if (Array.isArray(payload.message)) return payload.message[0] ?? "وضعیت سفارش دریافت نشد.";
  return payload.message ?? "وضعیت سفارش دریافت نشد.";
}

export function CheckoutResult({ orderNumber }: Readonly<{ orderNumber: string }>) {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderNumber) return;
    const controller = new AbortController();
    fetch(apiUrl(`/checkout/orders/${encodeURIComponent(orderNumber)}`), {
      credentials: "include",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json()) as Order & ApiMessage;
        if (!response.ok) throw new Error(errorText(payload));
        setOrder(payload);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError(cause instanceof Error ? cause.message : "ارتباط با سرور برقرار نشد.");
      });
    return () => controller.abort();
  }, [orderNumber]);

  const statusText = order?.status === "PAID"
    ? "پرداخت با موفقیت تأیید شد."
    : order?.status === "CANCELLED"
      ? "پرداخت انجام نشد یا لغو شد."
      : order ? "وضعیت پرداخت هنوز نهایی نشده است." : "در حال بررسی سفارش…";

  return (
    <section className="checkout-result container">
      <div className="checkout-result-card">
        <span className="eyebrow">وضعیت سفارش</span>
        <h1>{statusText}</h1>
        {order && (
          <p>
            شماره سفارش: <bdi dir="ltr">{order.orderNumber}</bdi>
            <br />
            مبلغ: {formatTomanAmount(order.totalToman)} تومان
          </p>
        )}
        {(error || (!orderNumber && "شماره سفارش در نشانی صفحه وجود ندارد.")) && (
          <p className="auth-error" role="alert">{error || "شماره سفارش در نشانی صفحه وجود ندارد."}</p>
        )}
        <div className="checkout-result-actions">
          <Link className="button button--primary" href="/student/orders">مشاهده سفارش‌ها</Link>
          <Link className="button button--outline" href="/courses">بازگشت به دوره‌ها</Link>
        </div>
      </div>
    </section>
  );
}
