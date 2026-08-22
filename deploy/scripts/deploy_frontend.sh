#!/usr/bin/env bash
set -euo pipefail

DEPLOY_APP_DIR="${DEPLOY_APP_DIR:-$PWD}"
COMPOSE_FILE="${COMPOSE_FILE:-deploy/compose/compose.frontend.yml}"

if [[ -z "${FRONTEND_IMAGE:-}" ]]; then
  echo "FRONTEND_IMAGE is required" >&2
  exit 1
fi

cd "$DEPLOY_APP_DIR"

echo "Deploying frontend image: $FRONTEND_IMAGE"

docker compose -f "$COMPOSE_FILE" pull frontend
docker compose -f "$COMPOSE_FILE" up -d frontend
