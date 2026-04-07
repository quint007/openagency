#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT"

PORT=3002 NEXT_PUBLIC_SERVER_URL=http://localhost:3002 pnpm --dir backend/openagency-backend dev &
BACKEND_PID=$!

trap 'kill "$BACKEND_PID"' EXIT INT TERM

pnpm --dir frontend dev
