import Link from "next/link";
import Image from "next/image";
import type { Course } from "@/lib/courses";
import { courseImageUrl } from "@/lib/api";
import { BrandLogo } from "@/components/brand-logo";

export function CourseCard({
  course,
  variant = "default",
  href,
}: {
  course: Course;
  variant?: "default" | "home";
  href?: string;
}) {
  const courseHref = href ?? `/courses/${course.slug}`;

  return (
    <article className={`course-card${variant === "home" ? " course-card--home" : ""}`}>
      <div className="course-thumb">
        <Link
          aria-label={`مشاهده دوره ${course.title}`}
          className={`course-thumb-link${course.image ? "" : " course-thumb-link--placeholder"}`}
          href={courseHref}
        >
          {course.image ? (
            <Image
              src={courseImageUrl(course.image)}
              alt=""
              fill
              sizes="(max-width: 680px) 100vw, (max-width: 900px) 50vw, 33vw"
              unoptimized={course.image.startsWith("/uploads/")}
            />
          ) : (
            <span className="course-placeholder">
              <span className="course-placeholder__mark" aria-hidden="true">
              <BrandLogo size={52} />
              </span>
              <span className="course-placeholder__copy">
                <small>مسیر آموزشی</small>
                <strong>{course.title}</strong>
              </span>
            </span>
          )}
        </Link>
        <span className="course-tag">{course.label}</span>
        <span className="course-number">{course.number}</span>
      </div>
      <div className="course-content">
        {course.instructor && <span className="course-instructor">{course.instructor.name}</span>}
        <div className="course-meta">
          <span>{course.duration}</span>
          <span>{course.lessons}</span>
        </div>
        <h3>{course.title}</h3>
        {variant !== "home" && <p>{course.description}</p>}
        <div className="course-card-footer">
          <div className="price">
            {course.price && course.isFree
              ? <strong>رایگان</strong>
              : course.price
                ? <strong>{course.price} <small>تومان</small></strong>
                : <strong className="price-pending">{course.isFree === false ? "قیمت اعلام نشده" : "اطلاعات ثبت‌نام"}</strong>}
            {course.price && course.oldPrice ? (
              <small><del>{course.oldPrice} تومان</del></small>
            ) : (
              <small>{course.price ? "دسترسی همیشگی" : "به‌زودی اعلام می‌شود"}</small>
            )}
          </div>
          <Link className="card-link" href={courseHref} aria-label={`مشاهده دوره ${course.title}`}>
            ←
          </Link>
        </div>
      </div>
    </article>
  );
}
