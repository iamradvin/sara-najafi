import type { HomeIconName } from "@/components/home/home-icon";

export type NavigationItem = Readonly<{
  label: string;
  icon: HomeIconName;
  href?: string;
  unavailable?: "favorites" | "featured" | "inbox" | "tutorial";
}>;

export type NavigationSection = Readonly<{
  title: string;
  icon: HomeIconName;
  items: readonly NavigationItem[];
}>;

export const navigationSections: readonly NavigationSection[] = [
  {
    title: "اطلاعات شخصی",
    icon: "profile",
    items: [
      { label: "ثبت‌نام / ورود", icon: "profile", href: "/login" },
      { label: "شارژ کیف پول", icon: "wallet", href: "/student/wallet" },
    ],
  },
  {
    title: "دوره‌های آموزشی",
    icon: "article",
    items: [
      { label: "دسته‌بندی دوره‌ها", icon: "article", href: "/courses" },
      { label: "دوره‌های من", icon: "video", href: "/student/courses" },
      { label: "علاقه‌مندی‌ها", icon: "bookmark", unavailable: "favorites" },
      { label: "مقالات", icon: "article", href: "/articles" },
      { label: "مقالات برگزیده", icon: "bookmark", unavailable: "featured" },
    ],
  },
  {
    title: "راه‌های ارتباطی",
    icon: "phone",
    items: [
      { label: "صندوق پیام", icon: "article", unavailable: "inbox" },
      { label: "آموزش اپلیکیشن", icon: "video", unavailable: "tutorial" },
      { label: "تماس با ما", icon: "phone", href: "/contact" },
    ],
  },
];

export const unavailableNavigationMessages: Record<NonNullable<NavigationItem["unavailable"]>, string> = {
  favorites: "علاقه‌مندی‌ها هنوز در حساب کاربری یا API پیاده‌سازی نشده‌اند.",
  featured: "برای مقالات برگزیده، API یا دسته‌بندی جداگانه‌ای در دسترس نیست.",
  inbox: "صندوق پیام هنوز به سرویس پیام‌رسان متصل نیست.",
  tutorial: "راهنمای استفاده از اپلیکیشن هنوز در محتوای سایت موجود نیست.",
};
