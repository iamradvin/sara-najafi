import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { PageLayout } from "@/components/site-shell";

export const metadata: Metadata = { title: "ورود | سارا نجفی" };

export default function LoginPage() {
  return <PageLayout><AuthForm mode="login" /></PageLayout>;
}
