# SaraNajafi — Copilot instructions

## Project context

- Preserve the existing SaraNajafi monorepo; do not recreate or replace its applications.
- The workspace uses pnpm and Turborepo: `apps/web` is Next.js, `apps/api` is NestJS, and `apps/worker` handles BullMQ jobs.
- Shared contracts, validation, configuration, API client, utilities, and UI live in `packages/`.
- PostgreSQL/Prisma is the source of truth. Redis supports cache and queues; authentication sessions remain database-backed.
- Keep architecture and deployment documentation factual. The production Compose setup is a single-host starting point, not a proven HA or load-tested deployment.

## Product and UI

- Treat visual design as a core requirement. Keep the Persian-first experience, correct RTL layout, responsive behavior, and existing design tokens.
- Reuse the bundled PeydaWeb fonts and established components before introducing new styles or dependencies.
- Preserve existing course, article, authentication, payment, and administration behavior unless the task explicitly changes it.
- Keep user-facing copy natural in Persian and verify layouts at mobile and desktop sizes for UI changes.

## Engineering workflow

- For changes spanning multiple modules or affecting architecture, first identify the relevant code, dependencies, and behavior; make a concise plan before editing.
- Prefer the smallest complete change and existing patterns. Keep shared types and validation in `packages/` instead of duplicating them between web and API.
- Add or update focused tests for changed behavior. Run the narrowest relevant check, then use `pnpm lint`, `pnpm typecheck`, `pnpm test`, or `pnpm build` as appropriate.
- Use the scripts that exist: the web app currently has lint, typecheck, and build but no dedicated test runner; API integration tests are available through `pnpm test:integration` and require isolated local test services.
- Do not add a test framework, formatter, UI library, or animation dependency just to satisfy generic guidance; first check existing tooling and patterns.
- Review the final diff for unintended changes and report checks accurately; never claim an unrun check passed.
- Update the relevant documentation when behavior, architecture, configuration, or operational steps change.

## Code quality

- Keep TypeScript strict and preserve the package boundaries. Avoid `any`, unsafe casts, duplicated contracts, and unused code.
- Keep controllers focused on HTTP concerns; put domain behavior in services and reusable cross-app contracts in `packages/`.
- Use the repository ESLint configuration. Do not assume Prettier, Vitest, Jest, or Playwright is configured.
- Follow existing error handling and structured logging; do not leave temporary debugging output in application code.
- Add comments only when they explain a non-obvious constraint or decision.

## Security and operations

- Never put credentials, tokens, private keys, or production secrets in source, examples, logs, or client-side code. Use environment variables and keep examples clearly non-production.
- Validate untrusted input at API boundaries and preserve authentication, authorization, and ownership checks on protected operations.
- Keep PostgreSQL and Redis unexposed in production; do not weaken session, payment, upload, or course-access controls for convenience.
- Treat infrastructure and external-service changes as security-sensitive; verify actual configuration and document any unvalidated production assumptions.

## GitHub and delivery

- The repository has a static GitHub Pages publishing workflow; do not assume it is the production deployment pipeline.
- Do not create branches, commits, or pull requests unless the user asks.
- Keep documentation aligned with verified behavior; do not claim load capacity, high availability, or production readiness without evidence.

These project instructions adapt workflow ideas documented by [ECC](https://github.com/affaan-m/ECC) for this repository. They do not install ECC's CLI agents, hooks, or runtime.
