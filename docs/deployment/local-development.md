# Local development

## Requirements

- Node.js 20.19 or later (Next.js 16 and the API's dependency graph require a supported modern Node release).
- pnpm 12.11.2 through Corepack.
- Docker Desktop for PostgreSQL and Redis.

## Native app processes with containerized dependencies

```sh
pnpm install
cp .env.example .env
docker compose up -d postgres redis
pnpm db:migrate
pnpm db:seed
pnpm dev
```

The root `pnpm dev` runs web, API and worker through Turborepo. It builds their workspace package dependencies first. The web app is at `http://localhost:3000`, API at `http://localhost:4000/api/v1`, and API health at `http://localhost:4000/api/v1/health`. PostgreSQL and Redis ports bind to `127.0.0.1`.

SMS OTP delivery uses FarazSMS's immediate pattern endpoint. Configure `FARAZ_SMS_API_KEY`, `FARAZ_SMS_PATTERN`, and an accessible numeric `FARAZ_SMS_SENDER` in `.env`; keep the API key private.

## Full Compose stack

After creating `.env` and applying the database migrations:

```sh
docker compose --profile apps up --build
```

The repository's authoritative files are `docker-compose.yml` (development) and `docker-compose.production.yml`; it does not contain separate `docker-compose.dev.yml`/`docker-compose.prod.yml` aliases or an Nginx configuration.

The web and API are available on localhost ports 3000 and 4000; the worker health endpoint is only on the private Compose network. Uploaded course images use the persistent `course_uploads` volume.

Development PostgreSQL and Redis are on separate internal Compose networks and bind to loopback for host tools. The web and Worker receive only their required API or Redis configuration; the full `.env` is passed to the API only. Production uses the same service separation and does not publish database or Redis ports.

Stop containers without deleting data:

```sh
docker compose --profile apps down
```

`docker compose down -v` removes the development database, Redis data and uploads volumes; use it only when that data is intentionally disposable.

## Tests and checks

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

`pnpm test` currently runs Node's built-in test runner for shared auth validators and utility functions. It is not a substitute for API integration, browser E2E or performance testing.

### API and worker integration tests

The opt-in integration suite starts the real API and Worker against dedicated test services. It applies the repository migrations to the selected test database, so never point it at development or production data. Create a disposable PostgreSQL database whose name ends in `_test` and a dedicated Redis logical database numbered above `0`; the runner rejects targets that do not meet those checks.

```sh
export TEST_DATABASE_URL='postgresql://USER:PASSWORD@127.0.0.1:5432/attractory_test?schema=public'
export TEST_REDIS_URL='redis://:PASSWORD@127.0.0.1:6379/15'
pnpm test:integration
```

The suite verifies PostgreSQL and Redis health, worker startup and health-job processing, removal of email/password auth endpoints, phone-only account/session authorization, database session revocation, protected routes, role checks, and graceful API/Worker shutdown. Educational-core cases also cover instructor ownership, course review/publishing, category constraints, module/lesson ordering and resources, free/manual enrollment history, refusal to self-enroll in paid courses, enrollment authorization, persisted progress, and course completion data. These integration cases were not run in the authoring environment because isolated test-service URLs were not configured. The suite creates uniquely named users and leaves them in the disposable test database; drop that database when finished. It does not send SMS or test real OTP provider delivery.

### Docker validation

Docker was unavailable in the authoring environment, so Compose parsing, image builds, runtime health, network reachability, and container shutdown remain unverified. On a Docker-enabled machine run:

```sh
docker compose config --quiet
docker compose --profile apps build
docker compose --profile apps up -d
docker compose ps
curl -fsS http://localhost:4000/api/v1/health
curl -fsS http://localhost:3000/
docker compose exec worker wget -qO- http://127.0.0.1:4001/health
docker compose stop --timeout 30 api worker web
docker compose --profile apps down
```

For production configuration validation and image builds, provide `.env.production` from the example and run `docker compose -f docker-compose.production.yml --env-file .env.production config --quiet` and `docker compose -f docker-compose.production.yml --env-file .env.production build`. The production proxy/TLS layer is external; this repository does not include an Nginx configuration.
