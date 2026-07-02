#!/usr/bin/env bash
set -Eeuo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: CONFIRM_DATABASE_RESTORE=yes $0 <backup.sql|backup.sql.gz>" >&2
  exit 1
fi

if [[ "${CONFIRM_DATABASE_RESTORE:-}" != "yes" ]]; then
  echo "Restore refused. Set CONFIRM_DATABASE_RESTORE=yes explicitly." >&2
  exit 1
fi

BACKUP_PATH="$1"
if [[ ! -f "$BACKUP_PATH" ]]; then
  echo "Backup not found: $BACKUP_PATH" >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${DOCKER_ENV_FILE:-$ROOT_DIR/.env.docker}"

if [[ "$BACKUP_PATH" == *.gz ]]; then
  gzip -dc "$BACKUP_PATH"
else
  cat "$BACKUP_PATH"
fi | docker compose --env-file "$ENV_FILE" exec -T database sh -c '
  exec mariadb \
    --user=root \
    --password="$MARIADB_ROOT_PASSWORD" \
    --default-character-set=utf8mb4 \
    "$MARIADB_DATABASE"
'

echo "Database restored from $BACKUP_PATH"
