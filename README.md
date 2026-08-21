# Full Stack Demo Project

Minimal monorepo MVP for auth + onboarding approvals with independent FE and BE deploy design.

## Stack

- Frontend: Next.js + TypeScript
- Backend: NestJS + TypeScript
- Worker: NestJS + BullMQ
- ORM: Prisma
- DB: PostgreSQL
- Queue/cache: Redis

## Implemented MVP

- Roles: `ADMIN`, `CUSTOMER`, `VENDOR`
- Customer/vendor registration creates `PENDING` approval
- Admin can approve or reject approvals
- Only `ACTIVE` users can complete login and access dashboard API
- Pending/rejected users get blocked on login and dashboard API
- Role dashboards available in frontend:
  - `/dashboard/admin`
  - `/dashboard/customer`
  - `/dashboard/vendor`

## Repo Layout

- `apps/frontend`
- `apps/backend`
- `apps/worker`
- `packages/shared-types`
- `deploy/compose`
- `deploy/nginx`
- `.github/workflows`

## Environment

1. Copy root env template:
   - `.env.example` -> `.env` (optional for local shell exports)
2. Copy backend env template:
   - `apps/backend/.env.example` -> `apps/backend/.env`
3. Copy frontend env template:
   - `apps/frontend/.env.local.example` -> `apps/frontend/.env.local`

Default local ports are intentionally non-conflicting:

- Postgres host: `5433` (container `5432`)
- Redis host: `6380` (container `6379`)
- Backend API: `3001`
- Frontend: `3000`

## Install

```bash
pnpm install
```

## Run Local Infra

```bash
pnpm dev:infra
docker-compose -f deploy/compose/compose.infra.yml ps
```

## Migrate and Seed

```bash
DATABASE_URL='postgresql://postgres:postgres@localhost:5433/full_stack_demo' pnpm --filter backend prisma:migrate --name init
DATABASE_URL='postgresql://postgres:postgres@localhost:5433/full_stack_demo' pnpm --filter backend prisma:seed
```

Seed is idempotent and creates/normalizes one admin user:

- `admin@example.com`
- `ChangeMe123!`

## Run Apps (separate terminals)

Backend:

```bash
DATABASE_URL='postgresql://postgres:postgres@localhost:5433/full_stack_demo' REDIS_URL='redis://localhost:6380' JWT_ACCESS_SECRET='dev-access-secret' JWT_REFRESH_SECRET='dev-refresh-secret' JWT_ACCESS_TTL='15m' JWT_REFRESH_TTL='7d' PORT='3001' pnpm --filter backend start
```

Backend with local defaults (no manual env export):

```bash
pnpm dev:backend:local
```

Worker:

```bash
REDIS_URL='redis://localhost:6380' pnpm --filter worker start
```

Worker with local defaults:

```bash
pnpm dev:worker:local
```

Frontend:

```bash
pnpm --filter frontend dev
```

Frontend with local defaults:

```bash
pnpm dev:frontend:local
```

All services with one command (infra + backend + worker + frontend):

```bash
pnpm dev:all:local
```

Stop local infra:

```bash
pnpm dev:infra:down
```

Run one-command CLI smoke flow (register -> approval -> login checks):

```bash
pnpm smoke:flow
```

## Quality Checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Backend service tests are included for login status behavior and approval decision paths.

API e2e tests are included for:

- health endpoint
- unauthorized dashboard access
- pending user login rejection
- live register -> approve -> dashboard flow (DB + Redis required)

Frontend integration tests are included for auth redirect guard behavior.

## API Endpoints

- `POST /api/auth/register/customer`
- `POST /api/auth/register/vendor`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/admin/approvals?status=pending`
- `POST /api/admin/approvals/:id/approve`
- `POST /api/admin/approvals/:id/reject`
- `GET /api/dashboard`

## Compose Units

- `deploy/compose/compose.infra.yml`: postgres + redis
- `deploy/compose/compose.backend.yml`: backend + worker
- `deploy/compose/compose.frontend.yml`: frontend

## CI/CD Workflows

- `ci.yml`: lint, typecheck, tests, build
- `ci.yml` includes a `backend-live-e2e` job with PostgreSQL and Redis service containers
- `deploy-backend.yml`: triggers on backend/worker/shared changes, runs migrate deploy, builds backend + worker
- `deploy-frontend.yml`: triggers on frontend/shared changes, builds/deploys frontend only

This split is designed so frontend deploys do not restart backend services and backend deploys do not restart frontend services.
