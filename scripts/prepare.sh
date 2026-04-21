#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT"

staged_files="$(git diff --cached --name-only --diff-filter=ACMRTUXB)"

if [ -z "$staged_files" ]; then
  echo "No staged files detected; skipping prepare checks."
  exit 0
fi

needs_deploy_config=false
needs_auth_contract=false
needs_backend_build=false
needs_marketing_build=false
needs_courses_build=false

while IFS= read -r file; do
  case "$file" in
    frontend/vercel.json|infra/modules/vercel/main.tf|infra/environments/production/main.tf|frontend/apps/marketing/vercel.json)
      needs_deploy_config=true
      ;;
  esac

  case "$file" in
    backend/openagency-backend/src/middleware.ts|backend/openagency-backend/src/environment.d.ts|backend/openagency-backend/.env.example|frontend/apps/marketing/src/middleware.ts|frontend/apps/marketing/.env.local.example|frontend/apps/marketing/src/app/api/revalidate/route.ts|infra/environments/production/main.tf|infra/environments/production/variables.tf)
      needs_auth_contract=true
      ;;
  esac

  case "$file" in
    backend/openagency-backend/*)
      needs_backend_build=true
      ;;
  esac

  case "$file" in
    frontend/apps/marketing/*|frontend/packages/ui/*|frontend/packages/api-client/*|frontend/packages/cms-client/*|frontend/turbo.json|frontend/package.json|frontend/vercel.json)
      needs_marketing_build=true
      ;;
  esac

  case "$file" in
    frontend/apps/courses/*|frontend/packages/ui/*|frontend/packages/api-client/*|frontend/packages/cms-client/*|frontend/turbo.json|frontend/package.json)
      needs_courses_build=true
      ;;
  esac
done <<< "$staged_files"

if [ "$needs_deploy_config" = true ]; then
  task prepare:deploy-config
fi

if [ "$needs_auth_contract" = true ]; then
  task prepare:auth-contract
fi

if [ "$needs_backend_build" = true ]; then
  task prepare:backend
fi

if [ "$needs_marketing_build" = true ]; then
  task prepare:marketing
fi

if [ "$needs_courses_build" = true ]; then
  task prepare:courses
fi
