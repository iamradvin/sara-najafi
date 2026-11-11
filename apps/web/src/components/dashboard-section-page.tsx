import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { AdminCourseManager } from "@/components/admin-course-manager";
import { StudentCoursesPanel, StudentOrdersPanel } from "@/components/student-data";
import { AdminCategoryManager } from "@/components/admin-category-manager";
import { AdminEnrollmentManager } from "@/components/admin-enrollment-manager";
import { AdminInstructorManager } from "@/components/admin-instructor-manager";
import { AdminOrdersPanel, AdminStudentsPanel } from "@/components/admin-dashboard-data";
import { DashboardIcon } from "@/components/dashboard-icon";
import { StudentProfileForm } from "@/components/student-profile-form";

const sectionContent = {
  student: {
    courses: {
      eyebrow: "مسیر یادگیری",
      title: "دوره‌های من",
      description: "دوره‌های فعال حساب کاربری از دیتابیس نمایش داده می‌شوند.",
    },
    orders: {
      eyebrow: "حساب کاربری",
      title: "سفارش‌ها",
      description: "سوابق سفارش و وضعیت پرداخت‌های حساب کاربری.",
    },
    profile: {
      eyebrow: "حساب کاربری",
      title: "حساب کاربری",
      description: "از اینجا به بخش‌های موردنیازت در فضای یادگیری برو.",
    },
    account: {
      eyebrow: "حساب کاربری",
      title: "اطلاعات پروفایل",
      description: "اطلاعات تماس و معرفی حساب کاربری.",
    },
  },
  admin: {
    courses: {
      eyebrow: "محتوای آموزشی",
      title: "مدیریت دوره‌ها",
      description: "مدیریت دوره‌های آموزشی.",
    },
    categories: {
      eyebrow: "ساختار آموزشی",
      title: "دسته‌بندی دوره‌ها",
      description: "دسته‌بندی‌های عمومی دوره‌ها را مدیریت کن.",
    },
    enrollments: {
      eyebrow: "مدیریت دسترسی",
      title: "ثبت‌نام دانشجوها",
      description: "ثبت و لغو دسترسی‌ها همراه با تاریخچه.",
    },
    instructors: {
      eyebrow: "مدیریت کاربران",
      title: "مدرسان",
      description: "نقش مدرس را به کاربران فعال بده یا لغو کن.",
    },
    students: {
      eyebrow: "مدیریت کاربران",
      title: "دانشجوها",
      description: "فهرست حساب‌های دانشجویی فعال از پایگاه داده.",
    },
    orders: {
      eyebrow: "مدیریت فروش",
      title: "سفارش‌ها",
      description: "پیگیری سفارش‌ها و وضعیت تأیید پرداخت از پایگاه داده.",
    },
  },
} as const;

type Props = Readonly<{
  type: "student" | "admin";
  section: string;
}>;

export function DashboardSectionPage({ type, section }: Props) {
  const content = sectionContent[type][section as keyof (typeof sectionContent)[typeof type]];
  if (!content) notFound();

  if (type === "admin" && section === "courses") {
    return (
      <DashboardShell type="admin">
        <section className="dashboard-welcome">
          <div>
            <div className="eyebrow">{content.eyebrow}</div>
            <h1>{content.title}</h1>
            <p>دوره‌ها از دیتابیس مدیریت می‌شوند؛ حذف دوره به‌صورت آرشیو و بدون پاک‌کردن سوابق انجام می‌شود.</p>
          </div>
        </section>
        <AdminCourseManager />
      </DashboardShell>
    );
  }

  if (type === "admin" && section === "categories") {
    return (
      <DashboardShell type="admin">
        <section className="dashboard-welcome">
          <div><div className="eyebrow">{content.eyebrow}</div><h1>{content.title}</h1><p>{content.description}</p></div>
        </section>
        <AdminCategoryManager />
      </DashboardShell>
    );
  }

  if (type === "admin" && section === "enrollments") {
    return (
      <DashboardShell type="admin">
        <section className="dashboard-welcome">
          <div><div className="eyebrow">{content.eyebrow}</div><h1>{content.title}</h1><p>{content.description}</p></div>
        </section>
        <AdminEnrollmentManager />
      </DashboardShell>
    );
  }

  if (type === "admin" && section === "instructors") {
    return (
      <DashboardShell type="admin">
        <section className="dashboard-welcome">
          <div><div className="eyebrow">{content.eyebrow}</div><h1>{content.title}</h1><p>{content.description}</p></div>
        </section>
        <AdminInstructorManager />
      </DashboardShell>
    );
  }

  if (type === "admin" && section === "students") {
    return (
      <DashboardShell type="admin">
        <section className="dashboard-welcome">
          <div><div className="eyebrow">{content.eyebrow}</div><h1>{content.title}</h1><p>{content.description}</p></div>
        </section>
        <AdminStudentsPanel />
      </DashboardShell>
    );
  }

  if (type === "admin" && section === "orders") {
    return (
      <DashboardShell type="admin">
        <section className="dashboard-welcome">
          <div><div className="eyebrow">{content.eyebrow}</div><h1>{content.title}</h1><p>{content.description}</p></div>
        </section>
        <AdminOrdersPanel />
      </DashboardShell>
    );
  }

  if (type === "student" && (section === "courses" || section === "orders")) {
    return (
      <DashboardShell type="student">
        <section className="dashboard-welcome">
          <div>
            <div className="eyebrow">{content.eyebrow}</div>
            <h1>{content.title}</h1>
            <p>{content.description}</p>
          </div>
          {section === "courses" && <Link className="button button--primary" href="/courses">دیدن دوره‌ها <span>←</span></Link>}
        </section>
        {section === "courses" ? <StudentCoursesPanel /> : <StudentOrdersPanel />}
      </DashboardShell>
    );
  }

  if (type === "student" && section === "profile") {
    const shortcuts = [
      { href: "/student", label: "نمای کلی", description: "خلاصه مسیر یادگیری و فعالیت اخیر", icon: "overview" },
      { href: "/student/courses", label: "دوره‌های من", description: "دوره‌ها و میزان پیشرفت", icon: "courses" },
      { href: "/student/orders", label: "سفارش‌ها", description: "سوابق و وضعیت پرداخت‌ها", icon: "orders" },
      { href: "/student/account", label: "اطلاعات پروفایل", description: "ویرایش نام و معرفی حساب", icon: "profile" },
    ] as const;

    return (
      <DashboardShell type="student">
        <section className="dashboard-welcome">
          <div><div className="eyebrow">{content.eyebrow}</div><h1>{content.title}</h1><p>{content.description}</p></div>
        </section>
        <nav aria-label="بخش‌های حساب کاربری" className="dashboard-shortcuts">
          {shortcuts.map((shortcut) => (
            <Link className="dashboard-shortcut" href={shortcut.href} key={shortcut.href}>
              <span className="dashboard-shortcut__icon"><DashboardIcon name={shortcut.icon} /></span>
              <span className="dashboard-shortcut__copy">
                <strong>{shortcut.label}</strong>
                <small>{shortcut.description}</small>
              </span>
              <span aria-hidden="true" className="dashboard-shortcut__arrow">←</span>
            </Link>
          ))}
        </nav>
      </DashboardShell>
    );
  }

  if (type === "student" && section === "account") {
    return (
      <DashboardShell type="student">
        <section className="dashboard-welcome">
          <div><div className="eyebrow">{content.eyebrow}</div><h1>{content.title}</h1><p>نام و معرفی حساب کاربری‌ات را مدیریت کن.</p></div>
        </section>
        <StudentProfileForm />
      </DashboardShell>
    );
  }

  notFound();
}
