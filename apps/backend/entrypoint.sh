#!/bin/sh
set -eu

python manage.py migrate --noinput
python manage.py collectstatic --noinput
# Fresh storage per master avoids stale counters after container restarts.
export PROMETHEUS_MULTIPROC_DIR="$(mktemp -d /tmp/prometheus.XXXXXX)"
exec gunicorn config.wsgi:application \
  --config config/gunicorn.py \
  --bind 0.0.0.0:8000 \
  --workers "${GUNICORN_WORKERS:-3}" \
  --timeout "${GUNICORN_TIMEOUT:-120}"
