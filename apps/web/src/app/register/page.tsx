import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { PageLayout } from "@/components/site-shell";

export const metadata: Metadata = { title: "ثبت‌نام | سارا نجفی" };

export default function RegisterPage() {
  return <PageLayout><AuthForm mode="register" /></PageLayout>;
}
