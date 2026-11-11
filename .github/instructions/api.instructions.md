---
applyTo: "apps/api/src/**/*.ts"
---

# API guidance

- Keep controllers thin: handle routing, guards, request validation, and response mapping there; implement business rules in services.
- Validate all client-controlled input with the established DTO/Zod validation patterns before using it.
- Enforce authentication, role, ownership, and enrollment checks in the backend; frontend visibility is not authorization.
- Use Prisma through existing services/modules. Use transactions when an operation changes related records atomically.
- Preserve database-backed authentication sessions. Do not grant paid access based on an unverified client claim.
- Keep errors explicit and use existing logging/error conventions; never log secrets, passwords, session tokens, or payment credentials.
- Add focused tests for changed behavior. Run `pnpm --filter @attractory/api lint` and `pnpm --filter @attractory/api typecheck`; integration tests require isolated local test services.
