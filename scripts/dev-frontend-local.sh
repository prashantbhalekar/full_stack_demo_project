#!/usr/bin/env bash
set -euo pipefail

NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-http://localhost:3001/api}"
export NEXT_PUBLIC_API_BASE_URL

pnpm --filter frontend dev
