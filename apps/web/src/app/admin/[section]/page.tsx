import { DashboardSectionPage } from "@/components/dashboard-section-page";

const titles: Record<string, string> = {
  courses: "مدیریت دوره‌ها",
  categories: "دسته‌بندی دوره‌ها",
  enrollments: "ثبت‌نام دانشجوها",
  instructors: "مدرسان",
  students: "دانشجوها",
  orders: "سفارش‌ها",
};

export async function generateMetadata({
  params,
}: Readonly<{ params: Promise<{ section: string }> }>) {
  const { section } = await params;
  return { title: `${titles[section] ?? "مدیریت"} | سارا نجفی` };
}

export default async function AdminSectionPage({
  params,
}: Readonly<{ params: Promise<{ section: string }> }>) {
  const { section } = await params;
  return <DashboardSectionPage type="admin" section={section} />;
}
