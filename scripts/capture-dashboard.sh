#!/usr/bin/env bash
set -Eeuo pipefail

# Capture a dashboard route at desktop and mobile widths using a local backend/frontend.
# Usage:
#   scripts/capture-dashboard.sh
#   ROUTE='/?process=7&compare=6' scripts/capture-dashboard.sh
#   OUTPUT_DIR=/tmp/unmsm-captures scripts/capture-dashboard.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/apps/backend"
FRONTEND_DIR="$ROOT_DIR/apps/fronted"
API_PORT="${API_PORT:-8001}"
FRONTEND_PORT="${FRONTEND_PORT:-5174}"
ROUTE="${ROUTE:-/?process=7}"
OUTPUT_DIR="${OUTPUT_DIR:-$ROOT_DIR/.artifacts/screenshots}"
API_URL="http://127.0.0.1:${API_PORT}"
FRONTEND_URL="http://127.0.0.1:${FRONTEND_PORT}"
TARGET_URL="${FRONTEND_URL}${ROUTE}"

backend_pid=""
frontend_pid=""

cleanup() {
  set +e
  if [[ -n "$frontend_pid" ]] && kill -0 "$frontend_pid" 2>/dev/null; then
    kill "$frontend_pid" 2>/dev/null || true
    wait "$frontend_pid" 2>/dev/null || true
  fi
  if [[ -n "$backend_pid" ]] && kill -0 "$backend_pid" 2>/dev/null; then
    kill "$backend_pid" 2>/dev/null || true
    wait "$backend_pid" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

wait_for_url() {
  local url="$1"
  local attempts=0
  until curl --fail --silent --show-error "$url" >/dev/null; do
    attempts=$((attempts + 1))
    if (( attempts >= 60 )); then
      echo "Timed out waiting for $url" >&2
      return 1
    fi
    sleep 1
  done
}

if ! command -v uv >/dev/null; then
  echo "uv is required to start the Django backend" >&2
  exit 1
fi
if ! command -v npm >/dev/null; then
  echo "npm is required to start the frontend" >&2
  exit 1
fi
if ! command -v npx >/dev/null; then
  echo "npx is required to capture screenshots" >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

(
  cd "$BACKEND_DIR"
  CORS_ALLOWED_ORIGINS="${FRONTEND_URL}" \
    uv run python manage.py runserver "0.0.0.0:${API_PORT}"
) >"$OUTPUT_DIR/backend.log" 2>&1 &
backend_pid=$!

(
  cd "$FRONTEND_DIR"
  VITE_API_BASE_URL="$API_URL" \
    npm run dev -- --host 0.0.0.0 --port "$FRONTEND_PORT"
) >"$OUTPUT_DIR/frontend.log" 2>&1 &
frontend_pid=$!

wait_for_url "$API_URL/health/"
wait_for_url "$FRONTEND_URL/"

# npx caches the CLI package; install only the Chromium browser if it is absent.
npx --yes playwright install chromium >/dev/null

capture() {
  local name="$1"
  local viewport="$2"
  echo "Capturing ${name} (${viewport}) from ${TARGET_URL}"
  npx --yes playwright screenshot \
    --browser=chromium \
    --viewport-size="$viewport" \
    --wait-for-timeout=3000 \
    "$TARGET_URL" \
    "$OUTPUT_DIR/unmsm-dashboard-${name}.png"
}

capture desktop "1440,1000"
capture mobile "390,844"

echo "Screenshots written to: $OUTPUT_DIR"
