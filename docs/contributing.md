# Contributing

This project is bootstrapped to help contributors get the marketing sites and Payload CMS running with a single command. Follow the sections below to go from a clean clone to `localhost:` for every service.

## Prerequisites

- **Node.js 20+** and **pnpm** (the repo uses pnpm workspaces inside `frontend/`).
- **Docker Desktop** (Docker Compose powers the local PostgreSQL instance in `docker-compose.yml`).
- **OpenTofu** is optional and only needed if you're touching the `infra/` directory.

## One-command setup

After cloning the repo, run `task setup` (or `devbox run task setup`). That task executes `scripts/setup.sh`, which:

1. Installs frontend (`frontend/`) and backend (`backend/openagency-backend/`) dependencies via pnpm.
2. Copies the example env files into place (`backend/openagency-backend/.env`, `frontend/apps/marketing/.env.local`, `frontend/apps/courses/.env.local`) without overwriting any edits.
3. Detects whichever Docker Compose binary is available and starts the `postgres` service defined in `docker-compose.yml`.
4. Waits until PostgreSQL accepts connections and then runs `pnpm --dir backend/openagency-backend exec payload migrate --yes`.

If you need to re-run the script after editing env values, delete the generated `.env*` files first so the task can regenerate them from the examples.

## Environment files

### Backend
- Copy `backend/openagency-backend/.env.example` to `backend/openagency-backend/.env`. Required variables:
  - `PAYLOAD_SECRET`: a randomly generated string that protects Payload CMS sessions.
  - `DATABASE_URL`: matches the Docker Compose credentials (`postgresql://open_agency:dev@localhost:5432/open_agency`).
  - `NODE_ENV=development` for local builds.

### Frontend apps
- Both `frontend/apps/marketing` and `frontend/apps/courses` ship `.env.local.example` files.
  - Copy each example to `.env.local` once, then edit as needed.
  - These files define `PORT` (`3000` for marketing, `3001` for courses) and `NEXT_PUBLIC_API_URL` (typically `http://localhost:3002/api`).
  - Every frontend request uses that env key, so keep it in sync with the backend port defined above.

## Running the apps

- `task dev` starts the backend (Payload CMS) and the frontend apps together via `scripts/dev.sh`.
- `task dev-frontend` launches only the marketing/courses stack; `task dev-backend` runs Payload CMS alone.

### Taskfile commands

- `task setup` – run the bootstrapper discussed above.
- `task dev` – bring up Payload plus the marketing/courses apps.
- `task dev-frontend` – just run the marketing/courses apps.
- `task dev-backend` – just run Payload CMS.
- Visit the services after `task dev`:
  - Payload admin: `http://localhost:3002/admin`
  - Marketing site: `http://localhost:3000`
  - Courses site: `http://localhost:3001`
- To inspect the local database, use `docker compose -f docker-compose.yml logs -f postgres` or `docker compose -f docker-compose.yml exec postgres psql ...`.

## Payload CMS notes

- Always run `pnpm --dir backend/openagency-backend exec payload migrate --yes` after changing collections or config.
- Credentials flow through `backend/openagency-backend/.env`; avoid checking unencrypted secrets into git.
- The `scripts/setup.sh` template already seeds the required Postgres database, so new contributors can rely on that automator.

## Frontend-specific workflow

- The marketing and courses apps read `NEXT_PUBLIC_API_URL` at build time to reach Payload's REST endpoints.
- The marketing and courses apps run on separate ports (3000 and 3001) so they can both be up in dev without conflicts.
- Turbo (`pnpm --dir frontend dev`) watches both apps and automatically rebuilds shared packages.

Whenever you document a new step or tool, keep this file in sync so onboarding stays under ten minutes from a clean clone.
