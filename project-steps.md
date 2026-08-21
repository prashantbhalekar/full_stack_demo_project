# Project Steps: Recreate Full Stack Demo From Scratch

## Purpose

This file is a practical runbook to recreate this project end-to-end from an empty directory to a fully working local setup.

Project objective:

- Minimal full-stack auth + onboarding approval flow.
- Roles: ADMIN, CUSTOMER, VENDOR.
- CUSTOMER/VENDOR registrations are PENDING until admin approves/rejects.
- Only ACTIVE users can login and access dashboards.
- Independent runtime units: infra, backend, worker, frontend.

---

## 0) Prerequisites

Install and verify:

```bash
node -v
pnpm -v
docker -v
docker-compose -v
```

Expected setup for this repo:

- Node 22.x
- pnpm 9.x
- Docker + docker-compose

---

## 1) Create Base Monorepo Structure

From project root:

```bash
mkdir -p apps/frontend apps/backend apps/worker
mkdir -p packages/shared-types/src
mkdir -p deploy/compose deploy/nginx
mkdir -p .github/workflows
mkdir -p scripts
```

Core root files to create:

- package.json
- pnpm-workspace.yaml
- tsconfig.base.json
- .env.example
- .gitignore
- README.md

Install dependencies:

```bash
pnpm install
```

---

## 2) Infra Unit (Postgres + Redis)

Create compose file:

- deploy/compose/compose.infra.yml

Start infra:

```bash
pnpm dev:infra
```

Check services:

```bash
docker-compose -f deploy/compose/compose.infra.yml ps
docker ps
```

Stop infra:

```bash
pnpm dev:infra:down
```

Current host port mappings in this project:

- Postgres: 5433 -> 5432 container
- Redis: 6380 -> 6379 container

---

## 3) Shared Types Package

Create/update shared contracts in:

- packages/shared-types/src/index.ts

Build shared package:

```bash
pnpm --filter @full-stack-demo/shared-types build
```

Typecheck shared package:

```bash
pnpm --filter @full-stack-demo/shared-types typecheck
```

---

## 4) Backend Unit (NestJS + Prisma)

Primary backend files:

- apps/backend/src/**
- apps/backend/prisma/schema.prisma
- apps/backend/prisma/seed.ts

Generate Prisma client:

```bash
DATABASE_URL='postgresql://postgres:postgres@localhost:5433/full_stack_demo' pnpm --filter backend prisma:generate
```

Create/apply migration initially:

```bash
DATABASE_URL='postgresql://postgres:postgres@localhost:5433/full_stack_demo' pnpm --filter backend prisma:migrate --name init
```

Apply migrations in repeatable/deploy mode:

```bash
DATABASE_URL='postgresql://postgres:postgres@localhost:5433/full_stack_demo' pnpm --filter backend prisma:migrate:deploy
```

Seed idempotent admin:

```bash
DATABASE_URL='postgresql://postgres:postgres@localhost:5433/full_stack_demo' ADMIN_EMAIL='admin@example.com' ADMIN_PASSWORD='ChangeMe123!' pnpm --filter backend prisma:seed
```

Run backend (explicit env):

```bash
DATABASE_URL='postgresql://postgres:postgres@localhost:5433/full_stack_demo' REDIS_URL='redis://localhost:6380' JWT_ACCESS_SECRET='dev-access-secret' JWT_REFRESH_SECRET='dev-refresh-secret' JWT_ACCESS_TTL='15m' JWT_REFRESH_TTL='7d' PORT='3001' pnpm --filter backend start
```

Run backend (local wrapper):

```bash
pnpm dev:backend:local
```

---

## 5) Worker Unit (NestJS + BullMQ)

Primary worker files:

- apps/worker/src/**

Run worker (explicit env):

```bash
REDIS_URL='redis://localhost:6380' pnpm --filter worker start
```

Run worker (local wrapper):

```bash
pnpm dev:worker:local
```

---

## 6) Frontend Unit (Next.js)

Primary frontend files:

- apps/frontend/src/app/**
- apps/frontend/src/lib/**

Run frontend directly:

```bash
pnpm --filter frontend dev
```

Run frontend with local wrapper:

```bash
pnpm dev:frontend:local
```

---

## 7) One-Command Local Runtime

Start all runtime pieces together (infra + backend + worker + frontend):

```bash
pnpm dev:all:local
```

Note:

- This script starts background processes and stops them on exit.

---

## 8) CLI Smoke Flow

Run complete functional smoke flow:

- register customer/vendor
- pending login block
- admin approve/reject
- approved user dashboard access
- rejected user login block

```bash
pnpm smoke:flow
```

---

## 9) Quality Gates (Local)

Run all checks:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Per-service checks:

```bash
pnpm --filter backend lint
pnpm --filter backend typecheck
pnpm --filter backend test
pnpm --filter backend build

pnpm --filter frontend lint
pnpm --filter frontend typecheck
pnpm --filter frontend test
pnpm --filter frontend build

pnpm --filter worker lint
pnpm --filter worker typecheck
pnpm --filter worker test
pnpm --filter worker build
```

---

## 9.1) Git Hooks (Pre-commit and Pre-push)

Hook tooling in this repo:

```bash
pnpm add -Dw husky lint-staged
pnpm exec husky init
```

Configured behavior:

- `.husky/pre-commit` runs `pnpm lint-staged`
- `.husky/pre-push` runs `pnpm typecheck && pnpm test && pnpm build`

Root `package.json` contains:

- `prepare` script to install hooks automatically after install
- `lint-staged` config for staged JS/TS files under `apps/` and `packages/`

---

## 10) Backend Tests

Unit/service + mocked e2e suite:

```bash
pnpm --filter backend test
```

Live backend e2e suite (requires running DB + Redis, migrations, seed):

```bash
pnpm --filter backend test:e2e:live
```

---

## 11) CI/CD Workflows

Main CI pipeline file:

- .github/workflows/ci.yml

Deploy workflows:

- .github/workflows/deploy-backend.yml
- .github/workflows/deploy-frontend.yml

Current CI expectations:

- lint
- typecheck
- tests
- build
- backend live e2e job with postgres/redis services

---

## 12) Environment Values Used During Development

Common values used while integrating this project:

```bash
DATABASE_URL='postgresql://postgres:postgres@localhost:5433/full_stack_demo'
REDIS_URL='redis://localhost:6380'
JWT_ACCESS_SECRET='dev-access-secret'
JWT_REFRESH_SECRET='dev-refresh-secret'
JWT_ACCESS_TTL='15m'
JWT_REFRESH_TTL='7d'
PORT='3001'
ADMIN_EMAIL='admin@example.com'
ADMIN_PASSWORD='ChangeMe123!'
NEXT_PUBLIC_API_BASE_URL='http://localhost:3001/api'
```

---

## 13) API Surface (MVP)

Implemented endpoints:

- POST /api/auth/register/customer
- POST /api/auth/register/vendor
- POST /api/auth/login
- POST /api/auth/refresh
- POST /api/auth/logout
- GET /api/auth/me
- GET /api/admin/approvals?status=pending
- POST /api/admin/approvals/:id/approve
- POST /api/admin/approvals/:id/reject
- GET /api/dashboard

---

## 14) Quick Recreate Sequence (Minimal)

If you only want the fastest rebuild path:

```bash
pnpm install
pnpm dev:infra
DATABASE_URL='postgresql://postgres:postgres@localhost:5433/full_stack_demo' pnpm --filter backend prisma:migrate:deploy
DATABASE_URL='postgresql://postgres:postgres@localhost:5433/full_stack_demo' pnpm --filter backend prisma:seed
pnpm dev:all:local
```

In another terminal:

```bash
pnpm smoke:flow
```

---

## 15) Notes

- Seed is idempotent and safe to rerun.
- Frontend and backend deployments are split by workflow and path triggers.
- Worker notifications log delivery when SMTP is not configured.
