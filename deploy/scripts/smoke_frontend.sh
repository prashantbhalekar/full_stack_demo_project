#!/usr/bin/env bash
set -euo pipefail

FRONTEND_BASE_URL="${FRONTEND_BASE_URL:-}"

if [[ -z "$FRONTEND_BASE_URL" ]]; then
  echo "FRONTEND_BASE_URL is required" >&2
  exit 1
fi

home_url="${FRONTEND_BASE_URL%/}/"
login_url="${FRONTEND_BASE_URL%/}/auth/login"

echo "Checking frontend home: $home_url"
curl -fsS "$home_url" >/dev/null

echo "Checking frontend login route: $login_url"
curl -fsS "$login_url" >/dev/null

echo "Frontend smoke check passed"
