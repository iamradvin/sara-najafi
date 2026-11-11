import type { Metadata } from "next";
import { CheckoutResult } from "@/components/checkout-result";
import { PageLayout } from "@/components/site-shell";

export const metadata: Metadata = { title: "نتیجه پرداخت | سارا نجفی" };

type CheckoutResultPageProps = {
  searchParams: Promise<{ order?: string }>;
};

export default async function CheckoutResultPage({ searchParams }: CheckoutResultPageProps) {
  const { order = "" } = await searchParams;
  return <PageLayout><CheckoutResult orderNumber={order} /></PageLayout>;
}
