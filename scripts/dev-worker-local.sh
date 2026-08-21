#!/usr/bin/env bash
set -euo pipefail

REDIS_URL="${REDIS_URL:-redis://localhost:6380}"
export REDIS_URL

pnpm --filter worker dev
