# CI/CD Pipelines

This directory contains the shared production task definition used by the root
`Taskfile.yml`. GitHub Actions workflows live under `.github/workflows/`.

## Pipelines

- `production.yaml` - Local production plan, apply, deploy, migration, smoke, and restore-drill tasks
- `.github/workflows/deploy.yml` - Pull request production plans and tag-triggered production releases
- `.github/workflows/rollback-backend.yml` - Manual application-only backend rollback by immutable commit SHA

The GitHub workflow gates plans and releases on frontend lint, tests,
typechecks, and a marketing build, plus backend lint, integration tests, and a
backend build. Tagged releases apply infrastructure, deploy both production
applications, and retry automated smoke checks against the backend and
marketing endpoints. The courses app is not currently part of the production
deployment or release gate.

Backend rollback is intentionally separate from the tag release workflow. The
manual rollback workflow deploys only the selected backend revision to Railway
and verifies backend health; it never applies infrastructure from the old
commit or deploys marketing.

## Deployment Configuration Contract

Use the repo-root `.env.example` as the source of truth for deployment keys. For local production operations, copy it to `.env` in the repo root. For CI/CD, mirror the same keys into your provider's variable store (GitHub Actions environment, GitLab CI/CD variables, etc.).

The current GitHub Actions deploy workflow requires the following secrets and variables.

### Required Secrets

| Secret Name                           | Description                                                    |
| ------------------------------------- | -------------------------------------------------------------- |
| `BACKEND_PAYLOAD_SECRET`              | Payload JWT encryption secret                                  |
| `BACKEND_CRON_SECRET`                 | Cron job authentication secret                                 |
| `BACKEND_PREVIEW_SECRET`              | Preview requests authentication secret                         |
| `BACKEND_REVALIDATE_SECRET`           | On-demand revalidation shared secret                           |
| `POSTGRES_PASSWORD`                   | Managed Railway Postgres password                              |
| `RAILWAY_TOKEN`                       | Railway API token (only if `RAILWAY_ENABLED=true`)             |
| `VERCEL_API_TOKEN`                    | Vercel API token (only if `VERCEL_ENABLED=true`)               |
| `MARKETING_PAYLOAD_API_KEY`           | Optional Payload API key for a `users` integration account     |
| `CLOUDFLARE_API_TOKEN`                | Cloudflare API token (only if `CLOUDFLARE_DNS_ENABLED=true`)   |
| `CLOUDFLARE_ACCOUNT_ID`               | Cloudflare account ID for R2                                   |
| `R2_ACCESS_KEY_ID`                    | R2 access key ID (required for production media)               |
| `R2_SECRET_ACCESS_KEY`                | R2 secret access key (required for production media)           |
| `RESEND_API_KEY`                      | Resend API key for backend email and marketing feedback fallback |
| `NEWSLETTER_SERVICE_SECRET`           | Shared secret for private marketing-to-backend newsletter calls |
| `NEWSLETTER_TOKEN_ENCRYPTION_KEY`      | Stable 32-byte base64url key for durable unsubscribe credentials |
| `NOTION_TOKEN`                        | Optional Notion integration token for feedback                 |

### Required Variables

| Variable Name                     | Value                                                                     |
| --------------------------------- | ------------------------------------------------------------------------- |
| `RAILWAY_ENABLED`                 | `true` or `false`                                                         |
| `VERCEL_ENABLED`                  | `true` or `false`                                                         |
| `VERCEL_TEAM`                     | Optional Vercel team slug or team ID                                      |
| `VERCEL_ORG_ID`                   | Vercel org/team ID used by the CLI deploy job                             |
| `MARKETING_VERCEL_PROJECT_NAME`   | Marketing Vercel project name (e.g. `open-agency-marketing`)              |
| `MARKETING_VERCEL_PROJECT_ID`     | Vercel project ID for the marketing app CLI deploy job                    |
| `MARKETING_VERCEL_DOMAIN`         | Production marketing domain (e.g. `open-agency.io`)                       |
| `POSTGRES_DATABASE_NAME`          | Managed Postgres database name (e.g. `open_agency`)                       |
| `POSTGRES_USER`                   | Managed Postgres username (e.g. `open_agency`)                            |
| `CLOUDFLARE_DNS_ENABLED`          | `true` or `false`                                                         |
| `CLOUDFLARE_ZONE_ID`              | Cloudflare zone ID (e.g., `abc123`)                                       |
| `CLOUDFLARE_ZONE_NAME`            | DNS zone name (e.g., `open-agency.io`)                                    |
| `R2_ENABLED`                      | `true` or `false`                                                         |
| `R2_BUCKET`                       | R2 bucket name used by the backend                                        |
| `R2_ENDPOINT`                     | S3-compatible R2 endpoint                                                 |
| `R2_PUBLIC_BASE_URL`              | Public media URL used by the backend                                      |
| `R2_PUBLIC_HOSTNAME`              | Public media hostname (e.g., `media.open-agency.io`)                      |
| `MARKETING_APP_BASE_URL`          | Marketing app URL (e.g., `https://open-agency.io`)                        |
| `COURSES_APP_BASE_URL`            | Courses app URL (e.g., `https://courses.open-agency.io`)                  |
| `MARKETING_REVALIDATE_URL`        | Optional direct marketing revalidation origin for the backend             |
| `COURSES_REVALIDATE_URL`          | Optional direct courses revalidation origin for the backend               |
| `NEXT_PUBLIC_GA_ID`               | Optional Google Analytics measurement ID                                  |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID`    | Optional Google AdSense client ID                                          |
| `NOTION_FEEDBACK_DATABASE_ID`      | Optional Notion database ID for feedback                                   |
| `RESEND_AUDIENCE_ID`               | Resend audience used by the backend after confirmed newsletter consent     |
| `NEWSLETTER_ENABLED`                | Production collection switch; keep `false` until launch approval           |
| `NEWSLETTER_PRIVACY_VERSION`        | Identifier of the exact approved and archived privacy notice                |
| `NEWSLETTER_MAINTENANCE_URL`        | Optional maintenance endpoint override; defaults to the production backend |

### Environment

Create a `production` environment in GitHub and assign the secrets/variables to it.

Newsletter addresses become broadcastable only after inbox confirmation. Payload/PostgreSQL is the consent authority; Resend mirrors confirmed active or withdrawn state. Public requests are limited per HMAC-pseudonymized requester, without storing raw requester addresses. The scheduled `newsletter-maintenance.yml` workflow sends queued confirmations and retries provider synchronization every 15 minutes using `BACKEND_CRON_SECRET`; it must remain operational even when `NEWSLETTER_ENABLED=false` so withdrawals, request-limit cleanup, and pending-record expiry continue. Production hard-codes `NEWSLETTER_WITHDRAWAL_REQUIRED=true`, so a paused deployment fails closed if the service secret or Resend withdrawal configuration is removed. Before enabling collection, deploy the database migration, configure and preserve `NEWSLETTER_TOKEN_ENCRYPTION_KEY`, publish the privacy legal document whose version exactly matches `NEWSLETTER_PRIVACY_VERSION`, verify the Resend audience and sender domain, approve the legal copy and retention policy, and exercise confirmation plus both unsubscribe paths in production. A non-2xx maintenance result means failed delivery state or excess due backlog remains and must be investigated. Before sending a campaign, confirm there are no newsletter records with `providerSyncStatus=failed`, verify one-click unsubscribe headers are DKIM-covered by Resend, and retain the reviewed consent/privacy text versions referenced by the consent ledger. Never import existing Resend contacts as consented; legacy contacts require a separately approved re-permission process.

For `admin.open-agency.io`, keep the Cloudflare DNS record DNS-only. The backend/admin origin is expected to terminate TLS at Railway rather than through Cloudflare proxying.

## Local Production Ops Tasks

The repo also exposes local production-only operator tasks through the repo-root `.env`:

- `task cutover:plan` — prints the required `apply -> deploy with startup migrations -> verify` production order.
- `task deploy:migrate` — incident-only escape hatch for running the affected release's migrations against an operator-supplied `BACKEND_DATABASE_URL`.
- `task deploy:verify` — runs backend/frontend smoke checks.
- `task restore:drill:plan` — prints the isolated restore-drill steps and follow-up smoke checks.

Additional optional `.env` values used by those tasks/scripts:

| Variable Name               | Description                                                                                    |
| --------------------------- | ---------------------------------------------------------------------------------------------- |
| `BACKEND_DATABASE_URL`      | Optional external/operator connection string for direct local migrations or restore drills     |
| `NEXT_PUBLIC_SERVER_URL`    | Override for backend smoke checks; defaults to `https://admin.open-agency.io`                  |
| `ALPHA_BASIC_AUTH_USERNAME` | Optional smoke-check username when the alpha gate is enabled                                   |
| `ALPHA_BASIC_AUTH_PASSWORD` | Optional smoke-check password when the alpha gate is enabled                                   |
| `MARKETING_REVALIDATE_URL`  | Optional direct marketing revalidation origin when the public site hostname should be bypassed |
| `COURSES_REVALIDATE_URL`    | Optional direct courses revalidation origin when the public site hostname should be bypassed   |
