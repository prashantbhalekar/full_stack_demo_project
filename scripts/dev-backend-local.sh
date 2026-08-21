#!/usr/bin/env bash
set -euo pipefail

DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5433/full_stack_demo}"
REDIS_URL="${REDIS_URL:-redis://localhost:6380}"
JWT_ACCESS_SECRET="${JWT_ACCESS_SECRET:-dev-access-secret}"
JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET:-dev-refresh-secret}"
JWT_ACCESS_TTL="${JWT_ACCESS_TTL:-15m}"
JWT_REFRESH_TTL="${JWT_REFRESH_TTL:-7d}"
PORT="${PORT:-3001}"

export DATABASE_URL REDIS_URL JWT_ACCESS_SECRET JWT_REFRESH_SECRET JWT_ACCESS_TTL JWT_REFRESH_TTL PORT

pnpm --filter backend dev
