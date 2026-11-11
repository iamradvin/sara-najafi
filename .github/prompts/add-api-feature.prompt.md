---
description: Add or update a NestJS API feature using SaraNajafi's existing architecture.
---

Implement the requested API behavior in the existing NestJS application.

1. Trace the existing controller, service, DTO/validation, authorization guard, Prisma models, and shared contracts before editing.
2. Keep controllers focused on HTTP concerns and business rules in services. Put reusable cross-app contracts and validation in `packages/`.
3. Enforce input validation, authentication, role/ownership/enrollment authorization, and explicit error behavior on the backend.
4. For database changes, add a new Prisma migration and update only the related schema, seed, and documentation. Do not rewrite applied migrations.
5. Add focused tests using existing test tooling. Never allow a client claim to substitute for verified payment state.
6. Run applicable API lint/typecheck/build checks. Run integration tests only with isolated local test services and report any check not performed.
