SHELL := /bin/bash

.PHONY: install infra-up infra-down migrate seed backend worker frontend dev smoke lint typecheck test build check

install:
	pnpm install

infra-up:
	pnpm dev:infra

infra-down:
	pnpm dev:infra:down

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
	pnpm dev:all:local

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
