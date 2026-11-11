"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@attractory/ui";
import {
  requestSmsOtpSchema,
  verifySmsOtpSchema,
} from "@attractory/validators";
import { apiUrl } from "@/lib/api";

type Props = Readonly<{ mode: "login" | "register" }>;
type AuthResponse = { roles?: string[]; success?: boolean; message?: string | string[] };

function getErrorMessage(payload: AuthResponse): string {
  if (Array.isArray(payload.message)) return payload.message[0] ?? "اطلاعات واردشده معتبر نیست.";
  return payload.message ?? "ورود انجام نشد. اطلاعات را بررسی و دوباره تلاش کن.";
}

function safeReturnPath(value: string | null): string | null {
  return value?.startsWith("/") && !value.startsWith("//") ? value : null;
}

function normalizeOtpCode(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[^0-9]/g, "")
    .slice(0, 6);
}

export function AuthForm({ mode }: Props) {
  const isRegister = mode === "register";
  const formRef = useRef<HTMLFormElement>(null);
  const autoSubmittedCode = useRef("");
  const [codeSent, setCodeSent] = useState(false);
  const [sentPhone, setSentPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!codeSent || busy || code.length !== 6 || autoSubmittedCode.current === code) return;
    autoSubmittedCode.current = code;
    formRef.current?.requestSubmit();
  }, [busy, code, codeSent]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const submittedPhone = codeSent ? sentPhone : String(formData.get("phone") ?? "");
    const endpoint = codeSent ? "/auth/otp/verify" : "/auth/otp/request";
    const body = codeSent
      ? { phone: sentPhone, code: String(formData.get("code") ?? ""), mode }
      : {
          phone: submittedPhone,
          mode,
          ...(isRegister ? { name: String(formData.get("name") ?? "") } : {}),
        };
    const schema = codeSent ? verifySmsOtpSchema : requestSmsOtpSchema;
    const validation = schema.safeParse(body);
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? "اطلاعات واردشده معتبر نیست.");
      setBusy(false);
      return;
    }

    try {
      const response = await fetch(apiUrl(endpoint), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as AuthResponse;
      if (!response.ok) {
        setError(getErrorMessage(payload));
        return;
      }

      if (!codeSent) {
        setSentPhone(submittedPhone);
        setCodeSent(true);
        return;
      }

      const returnPath = safeReturnPath(new URLSearchParams(location.search).get("next"));
      const fallback = payload.roles?.includes("SUPER_ADMIN") ? "/admin" : "/student";
      location.assign(returnPath ?? fallback);
    } catch {
      setError("ارتباط با سرور برقرار نشد. لطفاً کمی بعد دوباره تلاش کن.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-page container">
      <div className="auth-card">
        <div className="eyebrow">{isRegister ? "شروع یک مسیر تازه" : "خوش برگشتی"}</div>
        <h1>{isRegister ? "حساب کاربری بساز." : "وارد حسابت شو."}</h1>
        <p className="auth-intro">
          {isRegister
            ? "با شماره همراه ثبت‌نام کن و مسیر یادگیری تخصصی زیبایی مو را شروع کن."
            : "برای ورود، شماره همراهت را وارد کن تا کد تأیید برایت پیامک شود."}
        </p>
        <form className="auth-form" onSubmit={submit} ref={formRef}>
          {isRegister && !codeSent && (
            <label>
              نام و نام خانوادگی
              <input autoComplete="name" maxLength={160} minLength={2} name="name" required />
            </label>
          )}
          {codeSent ? (
            <>
              <p className="auth-otp-target" dir="ltr">{sentPhone}</p>
              <label className="auth-code-label">
                کد تأیید پیامک‌شده
                <span className="auth-code-input-wrap" dir="ltr">
                  <span aria-hidden="true" className="auth-code-slots">
                    {Array.from({ length: 6 }, (_, index) => (
                      <span
                        className={`auth-code-slot${index === code.length ? " is-current" : ""}`}
                        key={index}
                      >
                        {code[index] ?? ""}
                      </span>
                    ))}
                  </span>
                  <input
                    aria-label="کد تأیید شش‌رقمی"
                    autoComplete="one-time-code"
                    autoFocus
                    className="auth-code-input"
                    inputMode="numeric"
                    maxLength={6}
                    minLength={6}
                    name="code"
                    pattern="[0-9]{6}"
                    required
                    type="text"
                    value={code}
                    onChange={(event) => {
                      const normalizedCode = normalizeOtpCode(event.target.value);
                      if (normalizedCode !== code) autoSubmittedCode.current = "";
                      setCode(normalizedCode);
                    }}
                  />
                </span>
              </label>
              <button
                className="auth-resend"
                onClick={() => { setCodeSent(false); setCode(""); setError(""); }}
                type="button"
              >
                تغییر شماره یا درخواست کد تازه
              </button>
            </>
          ) : (
            <label>
              شماره همراه
              <input
                autoComplete="tel"
                dir="ltr"
                maxLength={16}
                name="phone"
                placeholder="09123456789"
                required
                type="tel"
              />
            </label>
          )}
          {error && <p className="auth-error" role="alert">{error}</p>}
          <Button className="auth-submit" disabled={busy} type="submit">
            {busy
              ? "در حال بررسی…"
              : codeSent
                ? isRegister ? "تأیید و ساخت حساب" : "تأیید و ورود"
                : "ارسال کد تأیید"}
            <span aria-hidden="true">←</span>
          </Button>
        </form>
        <p className="auth-switch">
          {isRegister ? "قبلاً حساب ساختی؟" : "حساب کاربری نداری؟"}{" "}
          <Link href={isRegister ? "/login" : "/register"}>
            {isRegister ? "وارد شو" : "ثبت‌نام"}
          </Link>
        </p>
        <p className="auth-security">
          کد یک‌بارمصرف پس از ۵ دقیقه منقضی می‌شود.
        </p>
      </div>
      <div className="auth-aside" aria-hidden="true">
        <span className="auth-aside-mark">SN</span>
        <p>یادگیری<br />زیبایی مو</p>
        <span className="auth-aside-star">✳</span>
      </div>
    </section>
  );
}
