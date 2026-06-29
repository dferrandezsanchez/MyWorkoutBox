#!/usr/bin/env bash
set -Eeuo pipefail

required_vars=(
  APP_PATH
  FRONTEND_PUBLIC_PATH
  DATABASE_URL
  JWT_SECRET
  CORS_ORIGIN
  VITE_API_URL
)

for var_name in "${required_vars[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    echo "Missing required environment variable: ${var_name}" >&2
    exit 1
  fi
done

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKUP_DIR="$APP_PATH/backups"
SERVICE_NAME="${SYSTEMD_SERVICE_NAME:-${PM2_APP_NAME:-myworkoutbox-api}}"

mkdir -p "$BACKUP_DIR" "$FRONTEND_PUBLIC_PATH"

write_backend_env() {
  cat > "$BACKEND_DIR/.env" <<EOF
DATABASE_URL="${DATABASE_URL}"
JWT_SECRET="${JWT_SECRET}"
JWT_EXPIRES_IN="${JWT_EXPIRES_IN:-7d}"
PORT=${PORT:-3000}
CORS_ORIGIN="${CORS_ORIGIN}"
EOF
}

write_frontend_env() {
  cat > "$FRONTEND_DIR/.env.production" <<EOF
VITE_API_URL=${VITE_API_URL}
EOF
  if [[ -n "${VITE_TENANT_ID:-}" ]]; then
    printf 'VITE_TENANT_ID=%s\n' "$VITE_TENANT_ID" >> "$FRONTEND_DIR/.env.production"
  fi
}

install_and_build_backend() {
  cd "$BACKEND_DIR"
  npm ci
  npm run prisma:generate
  npx prisma migrate deploy
  npm run build
}

install_and_build_frontend() {
  cd "$FRONTEND_DIR"
  npm ci
  npm run build
}

publish_frontend() {
  rsync -a --delete "$FRONTEND_DIR/dist/" "$FRONTEND_PUBLIC_PATH/"
}

restart_backend() {
  systemctl --user restart "$SERVICE_NAME" 2>/dev/null && return 0
  sudo -n systemctl restart "$SERVICE_NAME"
}

write_backend_env
write_frontend_env
install_and_build_backend
install_and_build_frontend
publish_frontend
restart_backend

echo "Release deploy completed."
