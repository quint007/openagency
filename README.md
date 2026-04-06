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

### Prerequisites

- Node.js 20+
- pnpm
- MongoDB (for backend)

### Installation

```bash
make install
```

### Development

```bash
make dev
```

This starts the frontend (Turborepo) with both Next.js apps.

### Build

```bash
make build
```

### Lint

```bash
make lint
```

## Environment Variables

### Backend

Copy `backend/.env` and update as needed:

```
PAYLOAD_SECRET=your-secret-key
MONGODB_URI=mongodb://localhost:27017/open-agency
PORT=3000
```

## Tech Stack

- **Frontend**: Next.js 14+, React 19, Turborepo, pnpm
- **Backend**: Payload CMS 3.x, MongoDB
- **Infrastructure**: OpenTofu
- **CI/CD**: GitHub Actions