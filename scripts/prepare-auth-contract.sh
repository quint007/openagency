#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT"

fail() {
  echo "prepare:auth-contract: $1" >&2
  exit 1
}

check_file_contains() {
  local file="$1"
  local needle="$2"
  if ! grep -q "$needle" "$file"; then
    fail "$file must contain $needle"
  fi
}

check_file_contains backend/openagency-backend/src/middleware.ts 'ALPHA_BASIC_AUTH_USERNAME'
check_file_contains backend/openagency-backend/src/middleware.ts 'ALPHA_BASIC_AUTH_PASSWORD'
check_file_contains backend/openagency-backend/src/middleware.ts 'NextResponse.redirect'
check_file_contains backend/openagency-backend/src/middleware.ts 'open-agency.io'

check_file_contains backend/openagency-backend/src/environment.d.ts 'ALPHA_BASIC_AUTH_USERNAME'
check_file_contains backend/openagency-backend/src/environment.d.ts 'ALPHA_BASIC_AUTH_PASSWORD'
check_file_contains backend/openagency-backend/.env.example 'ALPHA_BASIC_AUTH_USERNAME='
check_file_contains backend/openagency-backend/.env.example 'ALPHA_BASIC_AUTH_PASSWORD='

check_file_contains frontend/apps/marketing/src/middleware.ts 'ALPHA_BASIC_AUTH_USERNAME'
check_file_contains frontend/apps/marketing/src/middleware.ts 'ALPHA_BASIC_AUTH_PASSWORD'
check_file_contains frontend/apps/marketing/src/middleware.ts 'api\\/revalidate'
check_file_contains frontend/apps/marketing/.env.local.example 'ALPHA_BASIC_AUTH_USERNAME='
check_file_contains frontend/apps/marketing/.env.local.example 'ALPHA_BASIC_AUTH_PASSWORD='

check_file_contains infra/environments/production/main.tf 'ALPHA_BASIC_AUTH_USERNAME'
check_file_contains infra/environments/production/main.tf 'ALPHA_BASIC_AUTH_PASSWORD'

echo "prepare:auth-contract: passed"
