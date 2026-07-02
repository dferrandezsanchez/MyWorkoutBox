#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${DOCKER_ENV_FILE:-$ROOT_DIR/.env.docker}"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_PATH="$BACKUP_DIR/myworkoutbox-$TIMESTAMP.sql.gz"
TEMP_PATH="$BACKUP_PATH.tmp"

mkdir -p "$BACKUP_DIR"
trap 'rm -f "$TEMP_PATH"' EXIT

docker compose --env-file "$ENV_FILE" exec -T database sh -c '
  exec mariadb-dump \
    --user=root \
    --password="$MARIADB_ROOT_PASSWORD" \
    --single-transaction \
    --quick \
    --routines \
    --events \
    --triggers \
    --hex-blob \
    --default-character-set=utf8mb4 \
    "$MARIADB_DATABASE"
' | gzip -9 > "$TEMP_PATH"

test -s "$TEMP_PATH"
mv "$TEMP_PATH" "$BACKUP_PATH"
trap - EXIT

echo "$BACKUP_PATH"
