#!/usr/bin/env bash
set -euo pipefail

if [[ "${SKIP_INFRA:-0}" != "1" ]]; then
  pnpm dev:infra
fi

cleanup() {
  kill 0 || true
}
trap cleanup EXIT INT TERM

pnpm dev:backend:local &
backend_pid=$!
pnpm dev:worker:local &
worker_pid=$!
pnpm dev:frontend:local &
frontend_pid=$!

while true; do
  for pid in "$backend_pid" "$worker_pid" "$frontend_pid"; do
    if ! kill -0 "$pid" 2>/dev/null; then
      wait "$pid" || true
      exit 1
    fi
  done
  sleep 1
done
