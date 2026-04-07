#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

compose_file="$REPO_ROOT/docker-compose.yml"

copy_env_file() {
  local src="$1"
  local dst="$2"
  if [ -f "$dst" ]; then
    echo "  - $dst already exists, leaving untouched"
    return
  fi
  cp "$src" "$dst"
  echo "  - created $dst"
}

detect_docker_compose() {
  if docker compose version >/dev/null 2>&1; then
    echo "docker compose"
  elif docker-compose version >/dev/null 2>&1; then
    echo "docker-compose"
  else
    echo "Docker Compose (docker compose or docker-compose) is required" >&2
    exit 1
  fi
}

echo "Bootstrapping Open Agency local stack"

echo "Installing frontend dependencies"
pnpm --dir "$REPO_ROOT/frontend" install

echo "Installing backend dependencies"
pnpm --dir "$REPO_ROOT/backend/openagency-backend" install

echo "Copying environment files"
copy_env_file "$REPO_ROOT/backend/openagency-backend/.env.example" "$REPO_ROOT/backend/openagency-backend/.env"
copy_env_file "$REPO_ROOT/frontend/apps/marketing/.env.local.example" "$REPO_ROOT/frontend/apps/marketing/.env.local"
copy_env_file "$REPO_ROOT/frontend/apps/courses/.env.local.example" "$REPO_ROOT/frontend/apps/courses/.env.local"

DOCKER_COMPOSE_CMD=$(detect_docker_compose)

echo "Starting Postgres via Docker Compose"
$DOCKER_COMPOSE_CMD -f "$compose_file" up -d postgres

POSTGRES_CONTAINER=$($DOCKER_COMPOSE_CMD -f "$compose_file" ps -q postgres)
if [ -n "$POSTGRES_CONTAINER" ]; then
  echo -n "Waiting for Postgres to accept connections"
  until docker exec "$POSTGRES_CONTAINER" pg_isready -U open_agency >/dev/null 2>&1; do
    echo -n '.'
    sleep 1
  done
  echo " done"
else
  echo "Could not determine Postgres container ID, assuming service is ready"
fi

echo "Running Payload migrations"
pnpm --dir "$REPO_ROOT/backend/openagency-backend" exec payload migrate --yes

echo "Setup complete. Run 'task dev' to start Payload and the marketing/courses apps."
