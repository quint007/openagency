# Open Agency

Open Agency is a monorepo for the public publication, its Payload CMS, shared frontend packages, and production infrastructure.

## Structure

```text
openagency/
├── frontend/                       # Turborepo workspace
│   ├── apps/marketing/             # Active Next.js 16 publication
│   ├── apps/courses/               # Separate scaffold-stage course app
│   └── packages/                   # UI, API client, and CMS client
├── backend/openagency-backend/     # Payload CMS 3 on PostgreSQL
├── infra/                          # Production OpenTofu modules and composition
├── ci/                             # Root production task definitions and contract
├── docs/                           # Architecture, contributing, and operations
└── scripts/                        # Setup, verification, and release helpers
```

## Local Development

The supported command surface is Devbox plus the root Taskfile. Docker provides the local PostgreSQL 16 service from the root `docker-compose.yml`.

```bash
devbox run task setup
devbox run task dev
```

Use the narrower tasks when only one side of the stack is needed:

```bash
devbox run task dev-frontend
devbox run task dev-backend
```

See [`docs/contributing.md`](docs/contributing.md) for prerequisites, environment files, migrations, and package-specific commands.

## Verification

Frontend and backend are separate package roots:

```bash
devbox run pnpm --dir frontend build
devbox run pnpm --dir frontend lint
devbox run pnpm --dir frontend test:ui
devbox run pnpm --dir frontend --filter @open-agency/cms-client test
devbox run pnpm --dir backend/openagency-backend lint
devbox run pnpm --dir backend/openagency-backend test:int
```

## Documentation

- [`docs/architecture.md`](docs/architecture.md): system boundaries and production topology
- [`docs/runbook.md`](docs/runbook.md): operational command index
- [`infra/environments/production/README.md`](infra/environments/production/README.md): canonical production cutover, rollback, and restore procedures
- [`ci/README.md`](ci/README.md): GitHub Actions and production environment contract

## Stack

- Frontend: Next.js 16, React 19, Turborepo, pnpm
- Backend: Payload CMS 3, PostgreSQL, Resend, Cloudflare R2
- Production: Vercel, Railway, Cloudflare DNS/R2, OpenTofu
- Delivery: GitHub Actions release workflows
