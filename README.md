# Full Stack Demo Project

Minimal monorepo MVP for auth + onboarding approvals with independent FE and BE deploy design.

## Stack

- Frontend: Next.js + TypeScript
- Backend: NestJS + TypeScript
- Worker: NestJS + BullMQ
- ORM: Prisma
- DB: PostgreSQL
- Queue/cache: Redis

Detailed version matrix: [TECH_STACK.md](TECH_STACK.md)

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

Or via Makefile:

```bash
make install
```

## Run Local Infra

```bash
pnpm dev:infra
docker-compose -f deploy/compose/compose.infra.yml ps
```

Or via Makefile:

```bash
make infra-up
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

Or via Makefile:

```bash
make infra-down
```

Run one-command CLI smoke flow (register -> approval -> login checks):

```bash
pnpm smoke:flow
```

Or via Makefile:

```bash
make smoke
```

## Makefile Shortcuts

- `make install`: install dependencies
- `make infra-up`: start postgres + redis
- `make infra-down`: stop infra compose unit
- `make migrate`: run backend prisma migrate deploy against local DB
- `make seed`: run backend seed against local DB
- `make backend`: run backend with local defaults
- `make worker`: run worker with local defaults
- `make frontend`: run frontend with local defaults
- `make dev`: run infra + backend + worker + frontend
- `make smoke`: run end-to-end smoke flow
- `make lint`, `make typecheck`, `make test`, `make build`, `make check`: quality commands

## Quality Checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Git Hooks (Pre-commit and Pre-push)

This repository uses Husky hooks:

- pre-commit: runs `pnpm lint-staged` on staged files.
- pre-push: runs `pnpm check`.

Root `check` command runs:

- `pnpm lint`
- `cross-env DATABASE_URL=postgresql://ci:ci@localhost:5432/ci pnpm --filter backend prisma:generate`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

Hooks are installed automatically after `pnpm install` via the root `prepare` script.

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
- `deploy-backend.yml`: triggers on `dev`, `uat`, `main` for backend/worker/shared changes, builds and pushes backend + worker images, then deploys backend unit independently
- `deploy-frontend.yml`: triggers on `dev`, `uat`, `main` for frontend/shared changes, builds and pushes frontend image, then deploys frontend unit independently
- `deploy-full.yml`: manual coordinated release for backend + worker + frontend in one run

This split is designed so frontend deploys do not restart backend services and backend deploys do not restart frontend services.

## Branch to Environment Mapping

- `dev` branch -> `dev` environment
- `uat` branch -> `uat` environment
- `main` branch -> `prod` environment

The deploy workflows resolve this mapping via `deploy/scripts/branch_to_env.sh` and use the resolved environment in image tags.

Deploy jobs are bound to GitHub Environments (`dev`, `uat`, `prod`) so each branch uses environment-scoped secrets automatically. Manual dispatch for backend/frontend also supports environment override (`auto`, `dev`, `uat`, `prod`).

## Deployment Scripts

- `deploy/scripts/deploy_backend.sh`: deploy backend + worker compose unit
- `deploy/scripts/deploy_frontend.sh`: deploy frontend compose unit
- `deploy/scripts/deploy_full.sh`: coordinated deploy wrapper
- `deploy/scripts/smoke_backend.sh`: backend health smoke check
- `deploy/scripts/smoke_frontend.sh`: frontend route smoke checks

## Required GitHub Secrets For Deploy

Set these secrets in each GitHub Environment (`dev`, `uat`, `prod`) if you want deploy steps to run:

- `DEPLOY_SSH_HOST`
- `DEPLOY_SSH_USER`
- `DEPLOY_SSH_KEY`
- `DEPLOY_APP_DIR`
- `BACKEND_BASE_URL` (for backend smoke checks)
- `FRONTEND_BASE_URL` (for frontend smoke checks)

If SSH deploy secrets are not present, image build/push still runs and the workflow logs a deployment-skipped notice.
