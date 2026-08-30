#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT"

fail() {
  echo "prepare:deploy-config: $1" >&2
  exit 1
}

if [ -f frontend/apps/marketing/vercel.json ]; then
  fail "frontend/apps/marketing/vercel.json should not exist; the frontend-root Vercel config is authoritative."
fi

if [ ! -f frontend/vercel.json ]; then
  fail "frontend/vercel.json is missing."
fi

node --input-type=module <<'NODE'
import fs from 'node:fs'

const cfg = JSON.parse(fs.readFileSync('frontend/vercel.json', 'utf8'))
const expected = {
  framework: 'nextjs',
  buildCommand: 'pnpm turbo build --filter=marketing',
  installCommand: 'pnpm install',
  outputDirectory: 'apps/marketing/.next',
}

for (const [key, value] of Object.entries(expected)) {
  if (cfg[key] !== value) {
    throw new Error(`frontend/vercel.json ${key} must be ${JSON.stringify(value)}, got ${JSON.stringify(cfg[key])}`)
  }
}
NODE

production_main="$(cat infra/environments/production/main.tf)"

if printf '%s' "$production_main" | grep -Eq 'root_directory[[:space:]]*=[[:space:]]*"frontend"'; then
  fail "Production root_directory must not be set to frontend; it should stay null when frontend/vercel.json controls outputDirectory."
fi

if ! printf '%s' "$production_main" | grep -Eq 'root_directory[[:space:]]*=[[:space:]]*null'; then
  fail "Production root_directory should be null for the frontend-root deployment layout."
fi

if ! grep -Eq 'root_directory[[:space:]]*=[[:space:]]*var\.root_directory' infra/modules/vercel/main.tf; then
  fail "infra/modules/vercel/main.tf must pass root_directory through to the Vercel resource."
fi

node --input-type=module <<'NODE'
import fs from 'node:fs'

const dockerfile = fs.readFileSync('backend/openagency-backend/Dockerfile', 'utf8')
const commands = dockerfile
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line.startsWith('CMD '))
const expected = 'CMD ["sh", "-c", "NODE_OPTIONS=--no-deprecation payload migrate --yes && HOSTNAME=\\"0.0.0.0\\" exec node server.js"]'

if (commands.at(-1) !== expected) {
  throw new Error('The final backend image command must apply Payload migrations before starting the production server.')
}
NODE

if ! grep -Fq 'needs: [deploy-marketing-frontend, deploy-backend]' .github/workflows/deploy.yml; then
  fail "Production verification must wait for both application deployments."
fi

if grep -Eq '(^|[^[:alnum:]_])(tofu|terraform)([^[:alnum:]_]|$)' .github/workflows/rollback-backend.yml; then
  fail ".github/workflows/rollback-backend.yml must not apply historical infrastructure."
fi

if ! grep -Fq 'ref: ${{ inputs.backend_ref }}' .github/workflows/rollback-backend.yml; then
  fail ".github/workflows/rollback-backend.yml must deploy the requested immutable backend revision."
fi

if ! grep -Fq 'bash scripts/production/smoke-check.sh --backend-only' .github/workflows/rollback-backend.yml; then
  fail ".github/workflows/rollback-backend.yml must verify the backend after deployment."
fi

for normal_release_path in scripts/production/cutover.sh .github/workflows/deploy.yml .github/workflows/rollback-backend.yml; do
  if grep -Eq '(^|[^[:alnum:]_])(deploy:migrate|production:deploy:migrate|payload[[:space:]]+migrate)([^[:alnum:]_]|$)' "$normal_release_path"; then
    fail "$normal_release_path must not run a second migration outside the backend image."
  fi
done

task_body() {
  local file="$1"
  local heading="$2"

  awk -v heading="$heading" '
    $0 == heading { capture = 1; next }
    capture && $0 ~ /^  [^[:space:]].*:$/ { exit }
    capture { print }
  ' "$file"
}

for backend_task in 'Taskfile.yml|  deploy:backend:' 'ci/production.yaml|  deploy:backend:'; do
  file="${backend_task%%|*}"
  heading="${backend_task#*|}"
  body="$(task_body "$file" "$heading")"

  if [ -z "$body" ]; then
    fail "$file is missing the deploy:backend task."
  fi

  if printf '%s' "$body" | grep -Eq '(^|[^[:alnum:]_])(deploy:migrate|production:deploy:migrate|payload[[:space:]]+migrate)([^[:alnum:]_]|$)'; then
    fail "$file deploy:backend must not run a second migration outside the backend image."
  fi
done

echo "prepare:deploy-config: passed"
