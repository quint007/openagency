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

echo "prepare:deploy-config: passed"
