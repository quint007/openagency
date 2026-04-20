# CI/CD Pipelines

This directory contains CI/CD pipeline definitions for GitHub Actions.

## Pipelines

- `frontend.yml` - Frontend build, test, and deployment
- `backend.yml` - Backend build, test, and deployment
- `infra.yml` - Infrastructure plan and apply
- `.github/workflows/deploy.yml` - Production deploy (triggers on all tags)

## Deployment Configuration Contract

Use the repo-root `.env.example` as the source of truth for deployment keys. For local production operations, copy it to `.env` in the repo root. For CI/CD, mirror the same keys into your provider's variable store (GitHub Actions environment, GitLab CI/CD variables, etc.).

The current GitHub Actions deploy workflow requires the following secrets and variables.

### Required Secrets

| Secret Name | Description |
|------------|------------|
| `BACKEND_PAYLOAD_SECRET` | Payload JWT encryption secret |
| `BACKEND_CRON_SECRET` | Cron job authentication secret |
| `BACKEND_PREVIEW_SECRET` | Preview requests authentication secret |
| `BACKEND_REVALIDATE_SECRET` | On-demand revalidation shared secret |
| `POSTGRES_PASSWORD` | Managed Railway Postgres password |
| `RAILWAY_TOKEN` | Railway API token (only if `RAILWAY_ENABLED=true`) |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token (only if `CLOUDFLARE_DNS_ENABLED=true`) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID for R2 |
| `R2_ACCESS_KEY_ID` | R2 access key ID (required for production media) |
| `R2_SECRET_ACCESS_KEY` | R2 secret access key (required for production media) |
| `RESEND_API_KEY` | Resend API key for backend email delivery |

### Required Variables

| Variable Name | Value |
|--------------|-------|
| `RAILWAY_ENABLED` | `true` or `false` |
| `POSTGRES_DATABASE_NAME` | Managed Postgres database name (e.g. `open_agency`) |
| `POSTGRES_USER` | Managed Postgres username (e.g. `open_agency`) |
| `CLOUDFLARE_DNS_ENABLED` | `true` or `false` |
| `CLOUDFLARE_ZONE_ID` | Cloudflare zone ID (e.g., `abc123`) |
| `CLOUDFLARE_ZONE_NAME` | DNS zone name (e.g., `open-agency.io`) |
| `R2_ENABLED` | `true` or `false` |
| `R2_BUCKET` | R2 bucket name used by the backend |
| `R2_ENDPOINT` | S3-compatible R2 endpoint |
| `R2_PUBLIC_BASE_URL` | Public media URL used by the backend |
| `R2_PUBLIC_HOSTNAME` | Public media hostname (e.g., `media.open-agency.io`) |
| `MARKETING_APP_BASE_URL` | Marketing app URL (e.g., `https://open-agency.io`) |
| `COURSES_APP_BASE_URL` | Courses app URL (e.g., `https://courses.open-agency.io`) |
| `MARKETING_REVALIDATE_URL` | Direct marketing revalidation origin for the backend when the public hostname is proxied or unstable |
| `COURSES_REVALIDATE_URL` | Direct courses revalidation origin for the backend when the public hostname is proxied or unstable |

### Environment

Create a `production` environment in GitHub and assign the secrets/variables to it.

For `admin.open-agency.io`, keep the Cloudflare DNS record DNS-only. The backend/admin origin is expected to terminate TLS at Railway rather than through Cloudflare proxying.

If `open-agency.io` or `courses.open-agency.io` sit behind Cloudflare or any other edge that can fail TLS separately from the app origin, set `MARKETING_REVALIDATE_URL` / `COURSES_REVALIDATE_URL` to the direct deployment origin used for server-to-server calls. The backend revalidation hook prefers those values over the public app URL.

## Local Production Ops Tasks

The repo also exposes local production-only operator tasks through the repo-root `.env`:

- `task cutover:plan` — prints the required `apply -> deploy -> migrate -> verify` production order.
- `task deploy:migrate` — runs Payload migrations against an operator-supplied `BACKEND_DATABASE_URL` from the repo-root `.env` when you need an external direct connection.
- `task deploy:verify` — runs backend/frontend smoke checks.
- `task restore:drill:plan` — prints the isolated restore-drill steps and follow-up smoke checks.

Additional optional `.env` values used by those tasks/scripts:

| Variable Name | Description |
|--------------|-------------|
| `BACKEND_DATABASE_URL` | Optional external/operator connection string for direct local migrations or restore drills |
| `NEXT_PUBLIC_SERVER_URL` | Override for backend smoke checks; defaults to `https://admin.open-agency.io` |
| `ALPHA_BASIC_AUTH_USERNAME` | Optional smoke-check username when the alpha gate is enabled |
| `ALPHA_BASIC_AUTH_PASSWORD` | Optional smoke-check password when the alpha gate is enabled |
| `MARKETING_REVALIDATE_URL` | Optional direct marketing revalidation origin when the public site hostname should be bypassed |
| `COURSES_REVALIDATE_URL` | Optional direct courses revalidation origin when the public site hostname should be bypassed |
