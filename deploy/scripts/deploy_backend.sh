#!/usr/bin/env bash
set -euo pipefail

DEPLOY_APP_DIR="${DEPLOY_APP_DIR:-$PWD}"
COMPOSE_FILE="${COMPOSE_FILE:-deploy/compose/compose.backend.yml}"

if [[ -z "${BACKEND_IMAGE:-}" ]]; then
  echo "BACKEND_IMAGE is required" >&2
  exit 1
fi

if [[ -z "${WORKER_IMAGE:-}" ]]; then
  echo "WORKER_IMAGE is required" >&2
  exit 1
fi

cd "$DEPLOY_APP_DIR"

echo "Deploying backend image: $BACKEND_IMAGE"
echo "Deploying worker image: $WORKER_IMAGE"

docker compose -f "$COMPOSE_FILE" pull backend worker
docker compose -f "$COMPOSE_FILE" up -d backend worker
