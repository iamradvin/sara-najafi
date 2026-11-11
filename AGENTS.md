# Agent guide

## Repository map

- `apps/web`: Next.js App Router frontend. Preserve the existing Persian-first SaraNajafi experience and shared design system.
- `apps/api`: NestJS REST API and Prisma schema/migrations.
- `apps/worker`: BullMQ background worker.
- `packages/`: shared types, validation, configuration, API client, utilities, and UI.

## Working rules

- Read the existing implementation and the nearest `AGENTS.md` before changing a subsystem. Keep changes scoped; do not recreate apps or restructure the monorepo for convenience.
- Keep domain logic in services, HTTP concerns in controllers, and cross-app contracts in shared packages. Validate API input at the boundary and enforce authorization on the server.
- For Prisma changes, inspect existing models and migrations first. Add a migration; do not edit an already-applied migration to change schema history.
- For UI changes, use existing components, design tokens, and bundled Peyda fonts. Preserve RTL, responsive layouts, keyboard access, and reduced-motion behavior.
- Do not introduce new dependencies or assume tools that are not configured. In particular, web has no dedicated test script; the API integration suite requires isolated test PostgreSQL and Redis targets.
- Never expose `.env` values. Do not run destructive database or Git commands without explicit user authorization.

## Validation

Run the narrowest applicable check, then broader checks when the change spans packages:

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

For isolated API integration tests, use `pnpm test:integration` only after configuring `TEST_DATABASE_URL` to a local database ending in `_test` and `TEST_REDIS_URL` to a dedicated local Redis database greater than zero. Never point tests at production data.

Report checks that were not run and any infrastructure assumptions that remain unverified.
