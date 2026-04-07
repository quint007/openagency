# Open Agency

Monorepo for the Open Agency platform, containing frontend applications, backend services, and infrastructure.

## Structure

```
open-agency/
├── frontend/               # Turborepo — Next.js apps + shared packages
│   ├── apps/
│   │   ├── marketing/      # open-agency.io
│   │   └── courses/        # courses.open-agency.io
│   └── packages/
│       ├── ui/             # Shared component library + design tokens
│       └── api-client/     # TypeScript client for the API
├── backend/                # Payload CMS backend
├── infra/                  # OpenTofu infrastructure
├── ci/                     # CI/CD pipeline definitions
├── docs/                   # Documentation
└── .opencode/              # AI agent & skill configuration
```

## Getting Started

Full local setup (Docker, env files, and `make setup`) is documented in `docs/contributing.md`.

### Prerequisites

- Node.js 20+
- pnpm
- Docker Desktop (for the PostgreSQL container defined in `docker-compose.yml`)

### Installation

```bash
task install
```

### Development

```bash
task dev
```

This starts the Payload backend and the frontend (Turborepo) with both Next.js apps.

### Build

```bash
task build
```

### Lint

```bash
task lint
```

## Environment Variables

All runtime settings live in the `.env*` files described in `docs/contributing.md` (backend, marketing, and courses).

## Tech Stack

- **Frontend**: Next.js 14+, React 19, Turborepo, pnpm
- **Backend**: Payload CMS 3.x, MongoDB
- **Infrastructure**: OpenTofu
- **CI/CD**: GitHub Actions
