#!/usr/bin/env bash
set -euo pipefail

NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-http://localhost:3001/api}"
export NEXT_PUBLIC_API_BASE_URL

# Remove stale build cache that can be root-owned from previous docker runs.
if [[ -d apps/frontend/.next ]]; then
	if ! rm -rf apps/frontend/.next 2>/dev/null; then
		rotated_dir="apps/frontend/.next.root-owned.$(date +%s)"
		mv apps/frontend/.next "$rotated_dir"
		echo "Rotated non-writable .next cache to $rotated_dir"
	fi
fi

pnpm --filter frontend dev
