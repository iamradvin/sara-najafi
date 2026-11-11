# Security baseline

## Present controls

- NestJS uses Helmet, a configured CORS origin list, request DTO/schema validation and global rate limiting.
- Production registration and login use SMS OTP only; email and password authentication endpoints are not exposed.
- Auth uses server-validated roles, HTTP-only `SameSite=Lax` session cookies, `Secure` cookies in production, database session revocation, trusted-origin checks on mutations and SMS OTP attempt/expiry controls.
- An optional fixed OTP is restricted to one configured administrator in an explicitly isolated staging environment. It uses the regular OTP challenge and session flow, is disabled by default, and must never be enabled against production data.
- Zod auth schemas are shared by the browser and API. Login authorization never trusts role values from the client.
- PostgreSQL and Redis are private to the internal Compose network in the production template; development ports bind to loopback.
- Production Redis requires a password. Production environment files are ignored by Git; commit only the placeholder `.env.production.example`.
- Course-image uploads require administrator authorization, have size/type and file-signature checks, and use generated filenames.
- Course ownership, enrollment and progress authorization are checked by backend guards/services. Free self-enrollment is limited to published free courses; paid enrollment requires the existing verified server-side flow or an explicitly recorded admin action.

## Important limitations

- Session records are stored in PostgreSQL, not Redis. Do not cache session authorization without immediate invalidation on logout, revocation and account suspension.
- The Redis client, queues, and course upload volume are single-host local infrastructure, not HA. Production needs managed services, access controls, TLS where required, backup and recovery.
- Payment currently uses a Zarinpal-specific service. Provider verification and idempotency need a dedicated review before production.
- Lesson resources are URL references, not private files; direct HTTPS or `/uploads/` links may be shareable. Add an authenticated download proxy or private object-storage signing before storing materials that must not be public.
- Lesson progress uses client-reported watched/covered seconds. It is suitable for learner-facing progress indicators, not tamper-proof attendance or video-view verification.
- CSRF behavior relies on trusted-origin guards and `SameSite=Lax`; verify reverse-proxy HTTPS and cookie attributes against deployed browser origins. The integration suite asserts secure cookie attributes using a production-mode API process.
- Integration coverage now asserts that email/password endpoints are unavailable and exercises phone-only test accounts, database-backed sessions, protected routes, student/admin authorization, and the health-check worker. Educational-core API cases have been added for course ownership/publishing, curriculum, enrollment and progress, but remain unverified until run with isolated PostgreSQL/Redis test services. The suite does not use a real SMS provider or verify OTP delivery/expiry end-to-end.
- No automated dependency scanning, SAST, audit-log pipeline, MFA or external secret manager is configured here.
- Never send `.env`, `.env.production`, credentials, OTPs, cookies or production data to source control or logs. Rotate any credentials previously disclosed in chat or checked into local environments.
