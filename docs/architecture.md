# Architecture

Open Agency separates the public frontend workspace, the CMS backend, and production infrastructure so each can be built and deployed independently.

## Repository Boundaries

- `frontend/` is a pnpm/Turborepo workspace. `apps/marketing` is the active Next.js publication. `apps/courses` is a separate scaffold-stage application and is not part of the current production release path.
- `frontend/packages/ui` owns shared components, design tokens, and theme CSS.
- `frontend/packages/api-client` is the general API wrapper. `frontend/packages/cms-client` is the server-side content boundary used by the marketing app.
- `backend/openagency-backend/` is a standalone Payload CMS application with its own pnpm lockfile, migrations, tests, and Docker image.
- `infra/` contains reusable OpenTofu modules and the production composition. It is not part of either JavaScript workspace.

## Runtime Topology

```text
Readers ──> Vercel / Next.js marketing app ──> Railway / Payload API ──> Railway PostgreSQL
                        │                                  │
                        │                                  └──> Cloudflare R2 media
                        ├──> Resend newsletter/feedback fallback
                        └──> Notion feedback storage

Cloudflare DNS ──> Vercel and Railway service endpoints
```

The marketing app renders public pages and reads published content through `@open-agency/cms-client`. Payload owns editorial data, authentication, access control, migrations, scheduled publishing, and media metadata. PostgreSQL is the durable content store; R2 stores uploaded media.

## Content And Cache Flow

1. Editors manage drafts and published documents in Payload.
2. Collection hooks validate publication requirements and notify the frontend revalidation endpoint using the shared revalidation secret.
3. The marketing app invalidates affected paths/tags and fetches current published content from Payload.
4. Readers receive statically generated, dynamically rendered, or revalidated Next.js responses depending on the route.

Newsletter and feedback server actions run in the marketing deployment. Feedback writes to Notion when configured and falls back to Resend. Analytics and advertising scripts are loaded only through the consent integration.

## Production Delivery

Production uses Vercel for marketing, Railway for Payload and PostgreSQL, and Cloudflare for DNS and R2. OpenTofu defines the production resources and environment-variable contract. Tagged GitHub releases run frontend/backend quality gates, plan and apply infrastructure, deploy both applications, and execute post-deployment smoke checks. The backend image applies pending Payload migrations before serving; production migrations follow an expand-and-contract policy so the previous application revision remains rollback-compatible.

Operational details are intentionally kept in:

- [`../infra/environments/production/README.md`](../infra/environments/production/README.md) for cutover, migrations, rollback, and restore procedures
- [`runbook.md`](runbook.md) for the command index
- [`../ci/README.md`](../ci/README.md) for CI and production environment configuration
