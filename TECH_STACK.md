# Full Stack Demo Project: Detailed Tech Stack

This document is the detailed stack matrix for the monorepo and should be kept in sync with [README.md](README.md).

## Versioning Notes

- Declared version: what is written in package.json (often with caret ranges like ^x.y.z).
- Locked version: what pnpm-lock.yaml resolves at install time.
- Container/runtime version: image tags and workflow runner config.

## Monorepo and Core Tooling

| Area            | Technology     |              Version (Declared) |     Version (Locked/Runtime) | Source                                                                                                                                                                                         |
| --------------- | -------------- | ------------------------------: | ---------------------------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Monorepo        | pnpm workspace |              apps/_, packages/_ |                         same | [pnpm-workspace.yaml](pnpm-workspace.yaml)                                                                                                                                                     |
| Package manager | pnpm           |                          9.12.0 |           9.12.0 in CI setup | [package.json](package.json), [ci.yml](.github/workflows/ci.yml)                                                                                                                               |
| Node.js         | Node           |         22 (CI/Docker baseline) | node:22-alpine in containers | [ci.yml](.github/workflows/ci.yml), [apps/backend/Dockerfile](apps/backend/Dockerfile), [apps/frontend/Dockerfile](apps/frontend/Dockerfile), [apps/worker/Dockerfile](apps/worker/Dockerfile) |
| Language        | TypeScript     |                          ^5.7.2 |                        5.9.3 | [apps/frontend/package.json](apps/frontend/package.json), [apps/backend/package.json](apps/backend/package.json), [pnpm-lock.yaml](pnpm-lock.yaml)                                             |
| Linting         | ESLint         |                         ^9.17.0 |                       9.39.5 | [apps/frontend/package.json](apps/frontend/package.json), [apps/backend/package.json](apps/backend/package.json), [pnpm-lock.yaml](pnpm-lock.yaml)                                             |
| Formatting      | Prettier       | ^3.4.2 (backend/worker dev dep) |        resolved via lockfile | [apps/backend/package.json](apps/backend/package.json), [apps/worker/package.json](apps/worker/package.json)                                                                                   |
| Hooks           | Husky          |                          ^9.1.7 |        resolved via lockfile | [package.json](package.json)                                                                                                                                                                   |
| Staged lint     | lint-staged    |                         ^17.3.0 |        resolved via lockfile | [package.json](package.json)                                                                                                                                                                   |

## Frontend Stack

| Area              | Technology         | Version (Declared) | Version (Locked/Runtime) | Source                                                                                     |
| ----------------- | ------------------ | -----------------: | -----------------------: | ------------------------------------------------------------------------------------------ |
| Framework         | Next.js            |             15.0.4 |                   15.0.4 | [apps/frontend/package.json](apps/frontend/package.json), [pnpm-lock.yaml](pnpm-lock.yaml) |
| UI                | React              |             19.0.0 |                   19.0.0 | [apps/frontend/package.json](apps/frontend/package.json), [pnpm-lock.yaml](pnpm-lock.yaml) |
| UI renderer       | react-dom          |             19.0.0 |                   19.0.0 | [apps/frontend/package.json](apps/frontend/package.json), [pnpm-lock.yaml](pnpm-lock.yaml) |
| Validation        | zod                |            ^3.24.1 |    resolved via lockfile | [apps/frontend/package.json](apps/frontend/package.json)                                   |
| Testing           | Jest               |            ^29.7.0 |                   29.7.0 | [apps/frontend/package.json](apps/frontend/package.json), [pnpm-lock.yaml](pnpm-lock.yaml) |
| TS test adapter   | ts-jest            |            ^29.2.5 |    resolved via lockfile | [apps/frontend/package.json](apps/frontend/package.json)                                   |
| Lint config       | eslint-config-next |             15.0.4 |                   15.0.4 | [apps/frontend/package.json](apps/frontend/package.json)                                   |
| Container runtime | Node image         |                n/a |           node:22-alpine | [apps/frontend/Dockerfile](apps/frontend/Dockerfile)                                       |

## Backend Stack

| Area              | Technology                  | Version (Declared) | Version (Locked/Runtime) | Source                                                                                   |
| ----------------- | --------------------------- | -----------------: | -----------------------: | ---------------------------------------------------------------------------------------- |
| Framework         | NestJS core/common/platform |            ^11.0.x |    resolved via lockfile | [apps/backend/package.json](apps/backend/package.json)                                   |
| Config            | @nestjs/config              |             ^4.0.2 |    resolved via lockfile | [apps/backend/package.json](apps/backend/package.json)                                   |
| Auth              | @nestjs/jwt                 |            ^11.0.0 |    resolved via lockfile | [apps/backend/package.json](apps/backend/package.json)                                   |
| Auth              | @nestjs/passport            |            ^11.0.5 |    resolved via lockfile | [apps/backend/package.json](apps/backend/package.json)                                   |
| Queue integration | @nestjs/bullmq              |            ^11.0.2 |    resolved via lockfile | [apps/backend/package.json](apps/backend/package.json)                                   |
| ORM client        | @prisma/client              |            ^6.14.0 |                   6.19.3 | [apps/backend/package.json](apps/backend/package.json), [pnpm-lock.yaml](pnpm-lock.yaml) |
| ORM CLI           | prisma                      |            ^6.14.0 |                   6.19.3 | [apps/backend/package.json](apps/backend/package.json), [pnpm-lock.yaml](pnpm-lock.yaml) |
| Queue engine      | bullmq                      |            ^5.58.0 |    resolved via lockfile | [apps/backend/package.json](apps/backend/package.json)                                   |
| Password hashing  | bcryptjs                    |             ^2.4.3 |    resolved via lockfile | [apps/backend/package.json](apps/backend/package.json)                                   |
| Validation        | class-validator             |            ^0.14.1 |    resolved via lockfile | [apps/backend/package.json](apps/backend/package.json)                                   |
| Validation        | class-transformer           |             ^0.5.1 |    resolved via lockfile | [apps/backend/package.json](apps/backend/package.json)                                   |
| Auth protocol     | passport                    |             ^0.7.0 |    resolved via lockfile | [apps/backend/package.json](apps/backend/package.json)                                   |
| JWT strategy      | passport-jwt                |             ^4.0.1 |    resolved via lockfile | [apps/backend/package.json](apps/backend/package.json)                                   |
| Testing           | Jest                        |            ^29.7.0 |                   29.7.0 | [apps/backend/package.json](apps/backend/package.json), [pnpm-lock.yaml](pnpm-lock.yaml) |
| HTTP tests        | supertest                   |             ^7.1.1 |    resolved via lockfile | [apps/backend/package.json](apps/backend/package.json)                                   |
| Container runtime | Node image                  |                n/a |           node:22-alpine | [apps/backend/Dockerfile](apps/backend/Dockerfile)                                       |

## Worker Stack

| Area              | Technology                  | Version (Declared) | Version (Locked/Runtime) | Source                                                                                 |
| ----------------- | --------------------------- | -----------------: | -----------------------: | -------------------------------------------------------------------------------------- |
| Framework         | NestJS core/common/platform |            ^11.0.x |    resolved via lockfile | [apps/worker/package.json](apps/worker/package.json)                                   |
| Config            | @nestjs/config              |             ^4.0.2 |    resolved via lockfile | [apps/worker/package.json](apps/worker/package.json)                                   |
| Queue integration | @nestjs/bullmq              |            ^11.0.2 |    resolved via lockfile | [apps/worker/package.json](apps/worker/package.json)                                   |
| Queue engine      | bullmq                      |            ^5.58.0 |    resolved via lockfile | [apps/worker/package.json](apps/worker/package.json)                                   |
| Testing           | Jest                        |            ^29.7.0 |                   29.7.0 | [apps/worker/package.json](apps/worker/package.json), [pnpm-lock.yaml](pnpm-lock.yaml) |
| Container runtime | Node image                  |                n/a |           node:22-alpine | [apps/worker/Dockerfile](apps/worker/Dockerfile)                                       |

## Shared Package Stack

| Area             | Technology                    | Version (Declared) | Version (Locked/Runtime) | Source                                                                                                     |
| ---------------- | ----------------------------- | -----------------: | -----------------------: | ---------------------------------------------------------------------------------------------------------- |
| Shared contracts | @full-stack-demo/shared-types |              0.1.0 |  local workspace package | [packages/shared-types/package.json](packages/shared-types/package.json)                                   |
| Language         | TypeScript                    |             ^5.7.2 |                    5.9.3 | [packages/shared-types/package.json](packages/shared-types/package.json), [pnpm-lock.yaml](pnpm-lock.yaml) |

## Data and Infrastructure

| Area             | Technology            | Version (Declared) | Version (Locked/Runtime) | Source                                                                 |
| ---------------- | --------------------- | -----------------: | -----------------------: | ---------------------------------------------------------------------- |
| Relational DB    | PostgreSQL            |                n/a |              postgres:16 | [deploy/compose/compose.infra.yml](deploy/compose/compose.infra.yml)   |
| Cache + broker   | Redis                 |                n/a |                  redis:7 | [deploy/compose/compose.infra.yml](deploy/compose/compose.infra.yml)   |
| Local DB port    | Postgres host mapping |                n/a |             5433 -> 5432 | [deploy/compose/compose.infra.yml](deploy/compose/compose.infra.yml)   |
| Local cache port | Redis host mapping    |                n/a |             6380 -> 6379 | [deploy/compose/compose.infra.yml](deploy/compose/compose.infra.yml)   |
| ORM schema       | Prisma schema         |                n/a |   current schema in repo | [apps/backend/prisma/schema.prisma](apps/backend/prisma/schema.prisma) |
| Migration engine | Prisma Migrate        |                n/a |  migration files in repo | [apps/backend/prisma/migrations](apps/backend/prisma/migrations)       |

## Containers and Deployment Runtime

| Area                    | Technology     | Version (Declared) |        Version (Locked/Runtime) | Source                                                                                                                                                                                                                     |
| ----------------------- | -------------- | -----------------: | ------------------------------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Container engine config | Docker Compose |                n/a | compose files in deploy/compose | [deploy/compose/compose.infra.yml](deploy/compose/compose.infra.yml), [deploy/compose/compose.backend.yml](deploy/compose/compose.backend.yml), [deploy/compose/compose.frontend.yml](deploy/compose/compose.frontend.yml) |
| Image build/publish     | GitHub Action  |                n/a |     docker/build-push-action@v6 | [deploy-backend.yml](.github/workflows/deploy-backend.yml), [deploy-frontend.yml](.github/workflows/deploy-frontend.yml), [deploy-full.yml](.github/workflows/deploy-full.yml)                                             |
| Registry login          | GitHub Action  |                n/a |          docker/login-action@v3 | [deploy-backend.yml](.github/workflows/deploy-backend.yml), [deploy-frontend.yml](.github/workflows/deploy-frontend.yml), [deploy-full.yml](.github/workflows/deploy-full.yml)                                             |
| CI node setup           | GitHub Action  |                n/a |           actions/setup-node@v4 | [ci.yml](.github/workflows/ci.yml)                                                                                                                                                                                         |
| CI pnpm setup           | GitHub Action  |                n/a |            pnpm/action-setup@v4 | [ci.yml](.github/workflows/ci.yml)                                                                                                                                                                                         |

## Testing and Quality Gates

| Area                   | Technology           | Version (Declared) |                 Version (Locked/Runtime) | Source                                                                                                                                                                                                   |
| ---------------------- | -------------------- | -----------------: | ---------------------------------------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit/integration tests | Jest                 |            ^29.7.0 |                                   29.7.0 | [apps/backend/package.json](apps/backend/package.json), [apps/frontend/package.json](apps/frontend/package.json), [apps/worker/package.json](apps/worker/package.json), [pnpm-lock.yaml](pnpm-lock.yaml) |
| TS test compile        | ts-jest              |            ^29.2.5 |                    resolved via lockfile | [apps/backend/package.json](apps/backend/package.json), [apps/frontend/package.json](apps/frontend/package.json), [apps/worker/package.json](apps/worker/package.json)                                   |
| Live API E2E           | backend-live-e2e job |                n/a | Postgres 16 + Redis 7 service containers | [ci.yml](.github/workflows/ci.yml)                                                                                                                                                                       |
| Lint/type/build gate   | workspace scripts    |                n/a |        pnpm lint, typecheck, test, build | [package.json](package.json)                                                                                                                                                                             |

## Environment Model and Release Flow

| Area                | Value                                                                       | Source                                                                                                                                                                         |
| ------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Branch mapping      | dev -> dev, uat -> uat, main -> prod                                        | [deploy-backend.yml](.github/workflows/deploy-backend.yml), [deploy-frontend.yml](.github/workflows/deploy-frontend.yml)                                                       |
| Environment scoping | GitHub Environments per target stage                                        | [deploy-backend.yml](.github/workflows/deploy-backend.yml), [deploy-frontend.yml](.github/workflows/deploy-frontend.yml), [deploy-full.yml](.github/workflows/deploy-full.yml) |
| Deploy model        | independent backend and frontend deploys + optional coordinated full deploy | [deploy-backend.yml](.github/workflows/deploy-backend.yml), [deploy-frontend.yml](.github/workflows/deploy-frontend.yml), [deploy-full.yml](.github/workflows/deploy-full.yml) |

## Last Verification Context

This matrix reflects the current repository state and lockfile at the time of generation.
