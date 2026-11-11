import { DashboardSectionPage } from "@/components/dashboard-section-page";

const titles: Record<string, string> = {
  courses: "دوره‌های من",
  orders: "سفارش‌های من",
  profile: "پروفایل دانشجو",
};

export async function generateMetadata({
  params,
}: Readonly<{ params: Promise<{ section: string }> }>) {
  const { section } = await params;
  return { title: `${titles[section] ?? "فضای یادگیری"} | سارا نجفی` };
}

export default async function StudentSectionPage({
  params,
}: Readonly<{ params: Promise<{ section: string }> }>) {
  const { section } = await params;
  return <DashboardSectionPage type="student" section={section} />;
}
