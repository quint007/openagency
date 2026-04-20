# Production Environment

This root module encodes production defaults for `admin.open-agency.io` as the canonical backend/admin URL, with API traffic served from the same hostname under `/api`, while composing the reusable contracts in `infra/modules/`.

The admin/backend hostname is expected to stay **DNS-only** in Cloudflare so the Railway custom domain terminates TLS directly. If `admin.open-agency.io` returns a Cloudflare 525, verify the record is not proxied before debugging the app runtime.

## Operator inputs

Local production operations use the repo-root `.env`. Start from:

```bash
cp .env.example .env
```

Required values for the cutover flow:

- `BACKEND_PAYLOAD_SECRET`
- `BACKEND_CRON_SECRET`
- `BACKEND_PREVIEW_SECRET`
- `BACKEND_REVALIDATE_SECRET`
- `POSTGRES_PASSWORD`

Optional values for verification and operator-only direct database access:

- `NEXT_PUBLIC_SERVER_URL` (defaults to `https://admin.open-agency.io`)
- `RAILWAY_TOKEN`
- `POSTGRES_DATABASE_NAME`
- `POSTGRES_USER`
- `BACKEND_DATABASE_URL` (only if you need a direct external connection string for local migration or restore tooling)
- `ALPHA_BASIC_AUTH_USERNAME`
- `ALPHA_BASIC_AUTH_PASSWORD`

## Production cutover order

Production-only rollout follows this exact order:

1. **Apply** infrastructure.
2. **Deploy** the tagged backend release through GitHub Actions.
3. **Migrate** the production database explicitly.
4. **Verify** production with smoke checks.

The local command surface is:

```bash
task cutover:plan
task deploy:plan
task deploy:apply
git tag <release-tag>
git push origin <release-tag>
task deploy:migrate
task deploy:verify
```

`task cutover:plan` prints the same ordered flow without touching production.

### Why migration is separate

`Taskfile.yml` already treats Payload migrations as an explicit operational step in development. Production keeps the same contract: after the release tag is deployed, run the matching tagged code's migrations against `BACKEND_DATABASE_URL` using `task deploy:migrate`.

## Smoke verification

`task deploy:verify` runs `scripts/production/smoke-check.sh`, which checks:

- `NEXT_PUBLIC_SERVER_URL/admin`
- `NEXT_PUBLIC_SERVER_URL/api/globals/header?depth=0`
- `MARKETING_APP_BASE_URL/`
- `COURSES_APP_BASE_URL/`

If the alpha HTTP Basic Auth gate is enabled, set `ALPHA_BASIC_AUTH_USERNAME` and `ALPHA_BASIC_AUTH_PASSWORD` in `.env` before running the smoke check.

## Managed Railway Postgres

This environment now provisions Postgres as a dedicated Railway service plus a single attached volume when `railway_enabled = true`.

Important caveats:

- The current provider surface does **not** expose first-class spending caps or explicit free-tier sizing controls.
- This repo keeps the footprint minimal by using one Railway custom domain, one Postgres service, one volume, and no backup automation surface.
- The backend runtime `DATABASE_URL` is generated internally from `POSTGRES_DATABASE_NAME`, `POSTGRES_USER`, and `POSTGRES_PASSWORD` and injected into the backend Railway variable collection.
- The backend runtime now requires R2 media storage variables in the Railway variable collection: `R2_ACCESS_KEY_ID`, `R2_BUCKET`, `R2_ENDPOINT`, `R2_PUBLIC_BASE_URL`, and `R2_SECRET_ACCESS_KEY`.
- The Postgres volume mounts at `/var/lib/postgresql`, while `PGDATA=/var/lib/postgresql/data/pgdata` keeps initdb off the mount root and avoids the Railway `lost+found` failure.
- If you need to run migrations or restore tooling from outside Railway, provide an operator-only `BACKEND_DATABASE_URL` in the repo-root `.env`.

## Isolated restore drill

Because staging has been removed and Railway volume restores are same-environment only, the restore drill uses an **isolated restore target** instead of staging:

1. Export or obtain a logical production backup artifact.
2. Restore it into a disposable target database such as `open_agency_restore_drill` on a local or otherwise isolated Postgres instance.
3. Start the backend against that isolated database on a non-production port.
4. Run app smoke checks against the isolated backend target.

Print the exact command sequence with:

```bash
task restore:drill:plan
```

The script defaults to a local disposable database target and a local backend URL so the plan can be reviewed safely now.

## Rollback verification

Use the rollback path that matches the failure mode.

### Migration failure

1. Stop the rollout and do **not** continue to smoke verification.
2. Restore the most recent known-good logical backup artifact or execute the rollback SQL for the just-applied migration.
3. Redeploy the previous known-good release tag.
4. Re-run `task deploy:verify` after the database is back on the prior schema.

Concrete commands:

```bash
task restore:drill:plan
git push origin <previous-known-good-tag>
task deploy:verify
```

### Bad deploy or runtime failure

1. Re-point production to the previous known-good tag immediately.
2. Re-run smoke checks.
3. If the bad release also changed data shape, follow the migration-failure rollback above.

Concrete commands:

```bash
git push origin <previous-known-good-tag>
task deploy:verify
```

### DNS or domain failure

1. Re-apply the last known-good DNS target values in Cloudflare.
2. Confirm `admin.open-agency.io` resolves to the expected Railway-managed target, remains DNS-only in Cloudflare, and that `/api/*` requests succeed through the same hostname.
3. Re-run smoke checks once DNS propagates.

Concrete commands:

```bash
devbox run tofu -chdir=infra/environments/production plan
devbox run tofu -chdir=infra/environments/production apply
task deploy:verify
```

If provider-managed DNS is disabled, use the `environment_contract.cloudflare` output from this root module as the source of truth for the expected record targets before making the manual Cloudflare correction.

### Media cutover failure

1. Stop new media migrations.
2. Restore the previous media hostname / storage configuration.
3. Re-run the backend and frontend smoke checks, then verify representative media URLs manually.

Concrete commands:

```bash
git push origin <previous-known-good-tag>
task deploy:verify
```

If the failure happened during a media migration run, restore the last known-good database/media snapshot pairing before re-running traffic verification.
