#!/usr/bin/env bash
set -euo pipefail

branch_name="${1:-}"
sha="${2:-}"
override_environment="${3:-}"

if [[ -z "$branch_name" ]]; then
  echo "branch_to_env.sh requires branch name as first argument" >&2
  exit 1
fi

if [[ -z "$sha" ]]; then
  sha="local"
fi

short_sha="${sha:0:7}"

if [[ -n "$override_environment" && "$override_environment" != "auto" ]]; then
  environment="$override_environment"
else
  case "$branch_name" in
    dev)
      environment="dev"
      ;;
    uat)
      environment="uat"
      ;;
    main)
      environment="prod"
      ;;
    *)
      environment="dev"
      ;;
  esac
fi

image_tag="${environment}-${short_sha}"

echo "environment=${environment}"
echo "image_tag=${image_tag}"
echo "branch_name=${branch_name}"
