#!/bin/sh
set -e

python - <<'PY'
import os
import socket
import time

host = os.getenv("DB_HOST", "db")
port = int(os.getenv("DB_PORT", "5432"))
timeout_seconds = 60

start = time.time()
while True:
    try:
        with socket.create_connection((host, port), timeout=2):
            break
    except OSError:
        if time.time() - start > timeout_seconds:
            raise SystemExit(f"Timeout esperando PostgreSQL en {host}:{port}")
        time.sleep(1)
PY

if [ -f "manage.py" ] && [ "$1" = "python" ] && [ "$2" = "manage.py" ] && [ "$3" = "runserver" ]; then
    python manage.py migrate --noinput
fi

exec "$@"
