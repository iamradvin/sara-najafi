# Architecture overview

SaraNajafi is a pnpm/Turborepo monorepo with a Next.js App Router frontend, a modular NestJS REST API, PostgreSQL/Prisma persistence, optional Redis infrastructure, and a separate BullMQ worker process. It remains a modular monolith: the API owns business modules and the worker is an execution process, not a separately versioned business service.

## Repository applications

| Area | Status | Current implementation |
|---|---|---|
| `apps/web` | Implemented | Next.js 16 App Router, React, TypeScript, RTL pages, public course/article pages, and student/admin surfaces. |
| `apps/api` | Partially implemented | NestJS 12 REST API under `/api/v1`; auth, course/catalog management, curriculum, enrollments, persisted learning progress, orders, health, Prisma, Redis and queue infrastructure. Swagger UI is exposed at `/api/docs`. |
| `apps/worker` | Foundation implemented | BullMQ worker, Redis connection and health endpoint. Only the `platform-health` check job has a processor; business job processors are not implemented. |
| Realtime app | Intentionally absent | No separate realtime process is required yet. |

## Shared packages

- `packages/types`: shared published-course API contracts and queue names/job shapes.
- `packages/validators`: shared Zod schemas for phone-based SMS OTP authentication, consumed by both web and API.
- `packages/api-client`: typed Fetch wrapper and course endpoint methods.
- `packages/config`: API, web and worker environment validation.
- `packages/utils`: Persian-aware slug conversion and Redis URL parsing.
- `packages/ui`: reusable React button primitive that uses the web app's existing design-system classes.

Workspace packages compile to `dist/`; Turborepo builds package dependencies before application development, type-checking and builds.

## Runtime and data flow

The browser uses `NEXT_PUBLIC_API_URL`; server-rendered course details can use `INTERNAL_API_URL` to reach the API over the Compose network. The API validates request bodies, applies auth/session and role guards, and uses Prisma/PostgreSQL. PostgreSQL remains the source of truth for users, sessions, courses, orders and learning progress. Redis is a shared cache/ephemeral-data client and the BullMQ broker; current authentication does not store sessions in Redis. `REDIS_ENABLED` defaults to `true`; setting it to `false` allows a temporary API-only mode without Redis, but disables Redis operations and queue publishing. Do not deploy the Worker in that mode.

Course management is API-backed: public listings/details and instructor profiles; draft/review/publish/archive status; instructor ownership and admin assignment; categories; ordered modules/lessons; lesson resources; manual/free enrollment; enrollment history; and authenticated progress. The storage model retains `CourseSection`; `/modules` is the current authoring API term for those sections. Paid access remains granted only by server-verified payment processing or explicit administrator enrollment. Student learning pages read the enrolled course and persisted progress from the API. Progress tracks lesson completion, last accessed lesson and course completion, but its watched/covered seconds are client-reported and are not proof of actual viewing.

With `REDIS_ENABLED=true`, the API registers queues for SMS, email, notifications, video processing, certificates, analytics, reports and platform health. With it disabled, no BullMQ connections are created and queue publishing is unavailable. The worker keeps processors in a registry but currently registers only the side-effect-free `platform-health` handler; no business-job processor is implied. Queued jobs default to three attempts with exponential backoff and bounded retention. Any future processor that writes or calls an external service must define idempotency before retries are enabled for that work.

## Current gaps and verification boundaries

- No instructor self-service profile editor, course media processing, quiz, certificate, coupon, audit, analytics or notification workflows.
- Lesson resources store HTTPS or `/uploads/` URLs; there is no protected download proxy, so a direct resource URL can be shared outside the authenticated course view.
- The educational-core Prisma migration and new API integration cases are present, but were not applied/executed in this environment because isolated `TEST_DATABASE_URL` and `TEST_REDIS_URL` were not configured. Do not treat the feature set as database-integration-verified until `pnpm test:integration` passes against disposable services.
- No browser end-to-end suite or load-test suite.
- Payment flow is currently coupled to Zarinpal rather than a provider abstraction.
- Registration and login use phone-based SMS OTP only. Sessions are database-backed, not Redis-backed; legacy email and password columns remain for stored account data but are no longer authentication methods.
- Redis is required by API startup/health only when `REDIS_ENABLED=true`; no production cache invalidation or session-cache policy is implemented.
- No HAProxy/Nginx, object storage, FFmpeg pipeline, Prometheus/Grafana/Loki, or Sentry deployment is configured.
- The Compose production file is a deployment starting point, not a tested high-availability setup. Database and queue traffic use separate internal networks; the Worker is not attached to the database network. The current images are build-and-run images, not minimized multi-stage release images.

The repository is not load-tested for 2,000 concurrent users; that number remains a design target only.
