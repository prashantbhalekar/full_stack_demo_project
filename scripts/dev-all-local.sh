#!/usr/bin/env bash
set -euo pipefail

pnpm dev:infra

cleanup() {
  kill 0 || true
}
trap cleanup EXIT INT TERM

pnpm dev:backend:local &
pnpm dev:worker:local &
pnpm dev:frontend:local &

wait -n
