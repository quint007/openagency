#!/usr/bin/env bash
set -eu

dry_run=0
restore_dump="${RESTORE_DUMP_PATH:-./tmp/openagency-production.dump}"
target_database_url="${RESTORE_TARGET_DATABASE_URL:-postgresql://open_agency:dev@127.0.0.1:55433/open_agency_restore_drill}"
isolated_backend_url="${RESTORE_BACKEND_URL:-http://127.0.0.1:3102}"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --dry-run)
      dry_run=1
      shift
      ;;
    --restore-dump)
      restore_dump="$2"
      shift 2
      ;;
    --target-database-url)
      target_database_url="$2"
      shift 2
      ;;
    --backend-url)
      isolated_backend_url="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

cat <<EOF
Isolated restore drill plan

1. Restore the logical backup artifact into an isolated target database
   pg_restore --clean --if-exists --no-owner --dbname "${target_database_url}" "${restore_dump}"

2. Start the backend against the isolated target on a non-production port
   DATABASE_URL="${target_database_url}" \
   NEXT_PUBLIC_SERVER_URL="${isolated_backend_url}" \
   MARKETING_APP_BASE_URL="${MARKETING_APP_BASE_URL:-https://open-agency.io}" \
   COURSES_APP_BASE_URL="${COURSES_APP_BASE_URL:-https://courses.open-agency.io}" \
   pnpm --dir backend/openagency-backend dev

3. Run backend smoke checks against the isolated target
   bash scripts/production/smoke-check.sh --backend-url "${isolated_backend_url}" --api-url "${isolated_backend_url}" --backend-only

4. If the isolated backend passes, record the restore drill result and discard the isolated target
EOF

if [ "$dry_run" -eq 1 ]; then
  exit 0
fi

echo "This helper prints the isolated restore drill steps only. Run them deliberately against an isolated target." >&2
