# Database schema

Prisma schema: `apps/api/prisma/schema.prisma`. PostgreSQL is the authoritative datastore; IDs are UUIDs, timestamps use PostgreSQL `timestamptz`, and course/order/payment amounts are integer Toman values (not floating point).

## Implemented models

- Identity and authorization: `User`, `SmsOtpChallenge`, `Session`, `Role`, `Permission`, `UserRole`, `RolePermission`.
- Learning catalog: `Category`, `Course`, `CourseCategory`, `CourseSection` (module-equivalent), `Lesson`, `LessonResource`, `Enrollment`, `EnrollmentHistory`, `LessonProgress`, `CourseProgress`.
- Commerce: `Order`, `OrderItem`, `Payment`.
- Configuration: `BrandSetting`.

Relations declare delete behavior explicitly. User sessions and OTP challenges cascade with user lifecycle where modeled; course category, course sections, lessons, orders, payments, enrollments, and progress use restrictions/cascades appropriate to preserve transactional records. Unique constraints cover logins, slugs, provider references, enrollment pairs, per-user course progress, course positions, order items and role-permission joins. Lookup and lifecycle indexes cover session expiry, course publication, order state, instructor course lists, enrollment history, and progress.

The educational-core migration adds course instructor/currency/language fields, the `REVIEW` course status, published lessons, lesson resources, enrollment source/history, and one course-progress row per learner/course. `CourseSection` remains the storage name for ordered modules. Currency is currently restricted to `TOMAN`, matching the existing integer `priceToman` and checkout implementation. Course progress stores the last lesson/access timestamp and course completion timestamp; watched/covered seconds remain in `LessonProgress` and are client-reported.

## Migration history

The migration directory contains the initial schema plus migrations for optional course pricing, auth sessions, Zarinpal payment references, lesson progress coverage, SMS auth, and educational core (`20261107210000_educational_core`). Apply these with `pnpm db:migrate` locally (`prisma migrate dev`) or `pnpm db:migrate:deploy` in a deployed environment. The educational-core migration has not yet been applied or integration-tested in this environment.

## Scope and gaps

Instructor profile data is limited to optional bio/avatar fields; self-service profile management is not implemented. Resource records only store URLs and metadata and do not provide private file delivery. Coupons, quizzes/attempts, certificates, course reviews, notifications, audit logs, payment events, and many requested LMS entities are not in the current schema. Their names in future architecture plans must not be interpreted as implemented tables.
