# Production deployment starting point

This Compose configuration is a single-host starting point. It is not a tested HA deployment, and it does not demonstrate 2,000-user capacity. Use managed/high-availability PostgreSQL, Redis, persistent private object storage and a provider-supported load balancer for a production rollout.

## Configuration and launch

1. Create `.env.production` with the variables required by the production Compose services. Do not copy development defaults blindly; provide unique strong secrets and URL-encode credentials embedded in `DATABASE_URL` and `REDIS_URL`.
2. Set `WEB_ORIGIN` and `NEXT_PUBLIC_API_URL` to the real HTTPS origins before building the web image.
3. Configure the payment and SMS providers only with production credentials; set `ZARINPAL_SANDBOX=false` only after verified provider configuration.
4. Build and start:

   ```sh
   docker compose -f docker-compose.production.yml --env-file .env.production up -d --build
   ```

5. Apply migrations as an explicit release step:

   ```sh
   docker compose -f docker-compose.production.yml --env-file .env.production run --rm api pnpm --filter @attractory/api db:migrate:deploy
   ```

The PostgreSQL and Redis services publish no host ports. PostgreSQL and Redis use separate internal networks; the API joins both, while the Worker joins only the Redis network and cannot reach PostgreSQL. Web and API bind to loopback for a separately managed TLS reverse proxy. Only the API receives `.env.production`; web and Worker containers receive only their required runtime settings. Restrict host firewall access and do not forward the loopback ports publicly. Only PostgreSQL, Redis and uploaded image data have local Compose volumes; production backups, restore drills, monitoring and object-storage migration remain operator responsibilities.

For a temporary API-only mode without Redis, set `REDIS_ENABLED=false` on the API. The API will report Redis as disabled in its health response and will not connect to Redis or publish queue jobs. Do not deploy the Worker in this mode; queued work and Redis-backed features are unavailable. This is not a production configuration.

## Isolated staging login

For a client preview that needs an administrator account without SMS delivery, deploy a separate staging API and database with no production data. Set these API environment variables in the hosting provider's secret settings, never in source control:

```env
APP_ENV=staging
STAGING_FIXED_OTP_ENABLED=true
STAGING_FIXED_OTP_PHONE=09xxxxxxxxx
STAGING_FIXED_OTP_CODE=<private six-digit code>
AUTH_OTP_SECRET=<unique random secret of at least 32 characters>
```

After applying migrations, run `pnpm --filter @attractory/api db:seed` against that staging database with the same variables. It creates the configured phone as a `SUPER_ADMIN` only in staging. Login still uses the normal OTP challenge, expiry, attempt limit, database-backed session, and role checks; only the configured phone's login receives the fixed code without an SMS. The feature is disabled by default and API configuration rejects enabling it unless `APP_ENV=staging`. Never point staging at production databases, Redis, payment credentials, or uploads. Remove the fixed-login variables when the preview ends.

## Release limitations

The provided Dockerfiles install the full workspace and build in a single image. The API image installs OpenSSL for Prisma's native engine. Replace mutable base image tags with reviewed digests and adopt reviewed multi-stage runtime images before treating this template as hardened. No automatic migration, rollback, rolling deployment, TLS termination, distributed tracing, backup scheduler, HAProxy or Nginx configuration is included. Docker and these containers have not been verified in the current environment.
