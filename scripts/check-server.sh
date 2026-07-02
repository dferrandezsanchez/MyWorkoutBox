#!/usr/bin/env bash
set -Eeuo pipefail

echo "Docker: $(docker --version 2>/dev/null || echo 'missing')"
echo "Compose: $(docker compose version 2>/dev/null || echo 'missing')"
echo "Git: $(git --version 2>/dev/null || echo 'missing')"
echo "Disk: $(df -h "${APP_PATH:-.}" 2>/dev/null | tail -n 1 || echo 'unavailable')"

if docker info >/dev/null 2>&1; then
  echo "Docker engine: available"
else
  echo "Docker engine: unavailable" >&2
  exit 1
fi

if [[ -n "${APP_PATH:-}" ]]; then
  echo "APP_PATH: $APP_PATH"
  [[ -d "$APP_PATH/repo" ]] && echo "Repository exists" || echo "Repository missing"
fi

ENV_FILE="${DOCKER_ENV_FILE:-${APP_PATH:-.}/.env.docker}"
echo "Docker environment: $ENV_FILE"
[[ -f "$ENV_FILE" ]] && echo "Docker environment exists" || echo "Docker environment missing"
