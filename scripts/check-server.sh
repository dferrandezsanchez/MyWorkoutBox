#!/usr/bin/env bash
set -Eeuo pipefail

echo "Node: $(node --version 2>/dev/null || echo 'missing')"
echo "npm: $(npm --version 2>/dev/null || echo 'missing')"
echo "git: $(git --version 2>/dev/null || echo 'missing')"
echo "systemctl: $(systemctl --version 2>/dev/null | head -n 1 || echo 'missing')"
echo "rsync: $(rsync --version 2>/dev/null | head -n 1 || echo 'missing')"

if [[ -n "${APP_PATH:-}" ]]; then
  echo "APP_PATH: $APP_PATH"
  [[ -d "$APP_PATH" ]] && echo "APP_PATH exists" || echo "APP_PATH missing"
fi

if [[ -n "${FRONTEND_PUBLIC_PATH:-}" ]]; then
  echo "FRONTEND_PUBLIC_PATH: $FRONTEND_PUBLIC_PATH"
  [[ -d "$FRONTEND_PUBLIC_PATH" ]] && echo "FRONTEND_PUBLIC_PATH exists" || echo "FRONTEND_PUBLIC_PATH missing"
fi
