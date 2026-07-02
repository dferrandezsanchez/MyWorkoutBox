#!/usr/bin/env bash
set -Eeuo pipefail

required_vars=(APP_PATH RELEASE_REF)
for var_name in "${required_vars[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    echo "Missing required environment variable: ${var_name}" >&2
    exit 1
  fi
done

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${DOCKER_ENV_FILE:-$APP_PATH/.env.docker}"
BACKUP_DIR="${BACKUP_DIR:-$APP_PATH/backups}"
RELEASE_FILE="$APP_PATH/.last-successful-release"
PREVIOUS_RELEASE=""

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Docker environment file not found: $ENV_FILE" >&2
  exit 1
fi

if [[ -f "$RELEASE_FILE" ]]; then
  PREVIOUS_RELEASE="$(<"$RELEASE_FILE")"
fi

image_tag() {
  printf '%s' "$1" | tr '/:@' '---'
}

compose() {
  docker compose --env-file "$ENV_FILE" "$@"
}

rollback_application() {
  if [[ -z "$PREVIOUS_RELEASE" ]] || ! git rev-parse --verify --quiet "$PREVIOUS_RELEASE^{commit}" >/dev/null; then
    echo "No previous Docker release is available for automatic rollback." >&2
    return
  fi

  echo "Rolling application back to $PREVIOUS_RELEASE" >&2
  git checkout --detach "$PREVIOUS_RELEASE"
  export IMAGE_TAG="$(image_tag "$PREVIOUS_RELEASE")"
  compose up --build --detach --remove-orphans --wait
}

on_error() {
  local exit_code=$?
  trap - ERR
  rollback_application || true
  exit "$exit_code"
}
trap on_error ERR

cd "$ROOT_DIR"
export DOCKER_ENV_FILE="$ENV_FILE"
export BACKUP_DIR
export IMAGE_TAG="$(image_tag "$RELEASE_REF")"

if compose ps --status running --quiet database | grep -q .; then
  "$ROOT_DIR/scripts/docker-backup.sh"
fi

compose pull database
compose build --pull backend frontend migrate
compose up --detach --remove-orphans --wait

compose exec -T frontend wget --quiet --tries=1 --spider http://127.0.0.1:8080/healthz
compose exec -T frontend wget --quiet --tries=1 --spider http://127.0.0.1:8080/api/health

printf '%s\n' "$RELEASE_REF" > "$RELEASE_FILE"
trap - ERR

echo "Release $RELEASE_REF deployed successfully."
