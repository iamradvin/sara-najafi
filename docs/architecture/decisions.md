# Architecture decisions

## Keep SaraNajafi as a modular monolith

The existing Next.js and NestJS applications are preserved. Business domains remain modules inside the API. A separate worker process is added only for asynchronous job execution; a realtime application is deferred until a real use case exists.

## Use the existing pnpm and Turborepo workspace

No monorepo was re-initialized. Workspace package builds are explicit dependencies of app development, type checking and builds so package exports resolve from `dist/`.

## Keep PostgreSQL authoritative for user sessions

The existing HTTP-only session cookie and Prisma `Session` table remain unchanged. Redis is available for short-lived cache and queue infrastructure, but auth lookups are not cached: database revocation remains immediately authoritative. A Redis session store/cache requires an explicit revocation and failure-mode design before adoption.

## Share auth validation at the API boundary

The web app and NestJS auth endpoints use the same Zod schemas from `packages/validators`. The rest of the API continues using its established Nest validation setup until endpoints are migrated deliberately.

## Use BullMQ in the modular worker

The API exposes named queues through a single queue service. `apps/worker` currently implements a small health-check processor to prove queue connectivity and job execution. Business processors must be added alongside their owning domain contracts; unhandled health queue job types fail rather than succeeding silently.

## Preserve local dependencies and isolate production networks

The development Compose stack keeps PostgreSQL and Redis persistent and binds their ports to loopback. `docker-compose.production.yml` defines separate private database and broker networks; the API joins both, while the Worker can reach only Redis. Only web and API ports are bound to loopback for a host reverse proxy.

## Do not claim unverified production capacity

The 2,000-concurrent-user requirement is a target, not a measured result. Capacity claims require representative load tests against the actual deployment topology and service provider.

## Extend the existing course schema without renaming curriculum storage

The educational domain reuses the established `CourseSection` table as a module and exposes it through `/modules` APIs. This avoids a disruptive rename while keeping the authoring terminology clear. New course metadata, instructor ownership, lesson resources, enrollment history and course-level progress are additive Prisma models/fields in the educational-core migration.

## Keep paid enrollment server-authoritative

Self-enrollment is allowed only for published free courses. Paid courses continue to rely on the existing server-verified payment path; administrator-issued manual enrollment is a separate, audited source. Frontend claims of payment success never grant access.

## Treat learning resources and reported progress as unverified client data

Resource records contain links, not protected file contents; access to the course page does not make an external link private. Watched and covered seconds are client-reported, so they support progress display but do not prove video viewing or prevent tampering.
