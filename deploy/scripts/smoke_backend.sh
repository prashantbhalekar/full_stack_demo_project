#!/usr/bin/env bash
set -euo pipefail

BACKEND_BASE_URL="${BACKEND_BASE_URL:-}"

if [[ -z "$BACKEND_BASE_URL" ]]; then
  echo "BACKEND_BASE_URL is required" >&2
  exit 1
fi

health_url="${BACKEND_BASE_URL%/}/api/health"

echo "Checking backend health: $health_url"
curl -fsS "$health_url" >/dev/null

echo "Backend smoke check passed"
