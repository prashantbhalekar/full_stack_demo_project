#!/usr/bin/env bash
set -euo pipefail

bash deploy/scripts/deploy_backend.sh
bash deploy/scripts/deploy_frontend.sh
