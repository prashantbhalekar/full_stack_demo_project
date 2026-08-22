SHELL := /bin/bash

.PHONY: install infra-up infra-down clean migrate seed backend worker frontend dev smoke lint typecheck test build check

install:
	pnpm install

infra-up:
	pnpm dev:infra

infra-down:
	pnpm dev:infra:down

clean:
	docker-compose -f deploy/compose/compose.frontend.yml down --remove-orphans || true
	docker-compose -f deploy/compose/compose.backend.yml down --remove-orphans || true
	docker-compose -f deploy/compose/compose.infra.yml down -v --remove-orphans || true
	docker network rm full_stack_demo_network || true

migrate:
	DATABASE_URL='postgresql://postgres:postgres@localhost:5433/full_stack_demo' pnpm --filter backend prisma:migrate:deploy

seed:
	DATABASE_URL='postgresql://postgres:postgres@localhost:5433/full_stack_demo' pnpm --filter backend prisma:seed

backend:
	pnpm dev:backend:local

worker:
	pnpm dev:worker:local

frontend:
	pnpm dev:frontend:local

dev:
	pnpm dev:infra
	DATABASE_URL='postgresql://postgres:postgres@localhost:5433/full_stack_demo' pnpm --filter backend prisma:generate
	DATABASE_URL='postgresql://postgres:postgres@localhost:5433/full_stack_demo' pnpm --filter backend prisma:migrate:deploy
	DATABASE_URL='postgresql://postgres:postgres@localhost:5433/full_stack_demo' pnpm --filter backend prisma:seed
	SKIP_INFRA=1 pnpm dev:all:local

smoke:
	pnpm smoke:flow

lint:
	pnpm lint

typecheck:
	pnpm typecheck

test:
	pnpm test

build:
	pnpm build

check:
	pnpm check
