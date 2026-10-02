#!/bin/sh
set -eu

case "${PORT:-8000}" in
  ''|*[!0-9]*)
    echo "PORT must be a number" >&2
    exit 1
    ;;
esac

python scripts/bootstrap_admin.py
unset ANALYST_BOOTSTRAP_USERNAME ANALYST_BOOTSTRAP_PASSWORD

exec python -m uvicorn app.main:app \
  --app-dir /app/backend \
  --host 0.0.0.0 \
  --port "${PORT:-8000}" \
  --workers 1 \
  --proxy-headers \
  --forwarded-allow-ips='*'
