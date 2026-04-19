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

- `task dev` now runs the local dev preflight inside the root `Taskfile.yml`: it verifies the env files exist, clears ports `3000`, `3001`, and `3002`, starts PostgreSQL via Docker Compose, waits for the database to accept connections, runs Payload migrations, and then launches the backend plus the frontend apps together.
- `task dev-frontend` launches only the marketing/courses stack; `task dev-backend` runs Payload CMS alone.

### Taskfile commands

- `task setup` – run the bootstrapper discussed above.
- `task dev` – run the reusable dev preflight tasks, then bring up Payload plus the marketing/courses apps.
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
- The `scripts/setup.sh` template still prepares dependencies and env files, while `task dev` now owns ongoing runtime orchestration for the local database and CMS.

## Frontend-specific workflow

- The marketing and courses apps read `NEXT_PUBLIC_API_URL` at build time to reach Payload's REST endpoints.
- The marketing and courses apps run on separate ports (3000 and 3001) so they can both be up in dev without conflicts.
- Turbo (`pnpm --dir frontend dev`) watches both apps and automatically rebuilds shared packages.

Whenever you document a new step or tool, keep this file in sync so onboarding stays under ten minutes from a clean clone.

## Manual Production Deploy (local operator)

For local operators who need to run production infrastructure changes without CI:

### Prerequisites

1. **Create a local `.env` file** in the repo root from the top-level deployment template (this file is gitignored — do not commit real credentials):
   ```bash
    # Copy the example template
    cp .env.example .env
    
    # Edit .env with real values
    ```
    
    Required variables in `.env`:
    - `BACKEND_PAYLOAD_SECRET` — Payload JWT encryption secret
    - `BACKEND_CRON_SECRET` — Cron job authentication secret
    - `BACKEND_PREVIEW_SECRET` — Preview requests authentication secret
    - `BACKEND_REVALIDATE_SECRET` — On-demand revalidation shared secret
    - `POSTGRES_PASSWORD` — Managed Railway Postgres password
   
    Optional variables (only needed when enabling provider features or ops verification):
    - `RAILWAY_ENABLED`, `RAILWAY_PROJECT_NAME`, `RAILWAY_TOKEN`, `POSTGRES_DATABASE_NAME`, `POSTGRES_USER`
    - `CLOUDFLARE_DNS_ENABLED`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_ZONE_NAME`
    - `R2_ENABLED`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT`, `R2_PUBLIC_BASE_URL`, `R2_PUBLIC_HOSTNAME`
    - `BACKEND_DATABASE_URL` (only if you need a direct external connection string for local migration or restore tooling)
    - `ALPHA_BASIC_AUTH_USERNAME`, `ALPHA_BASIC_AUTH_PASSWORD`

### Deploy Commands

```bash
# Print the ordered production runbook for the current env file
task cutover:plan

# Plan infrastructure changes (non-destructive)
task deploy:plan

# Apply infrastructure changes (requires confirmation)
task deploy:apply

# Deploy the tagged release through GitHub Actions
git tag <release-tag>
git push origin <release-tag>

# Deploy the backend Payload instance to Railway manually
task deploy:backend

# Run the explicit post-deploy migration step
task deploy:migrate

# Run production smoke checks
task deploy:verify

# Destroy production infrastructure (requires confirmation)
task deploy:destroy
```

Alternatively, use the production namespace directly:
```bash
task production:deploy:plan
task production:deploy:apply
task production:deploy:backend
task production:deploy:migrate
task production:deploy:verify
task production:deploy:destroy
```

### Command Details

- The deploy tasks automatically load the repo-root `.env` via Taskfile's `dotenv` feature.
- Use the repo-root `.env.example` as the single deployment contract for local runs and CI variable setup.
- Secrets are passed to OpenTofu via `-var` flags only when the corresponding environment variables are set in `.env`.
- The deploy still supports provider defaults, but production media storage now requires the R2 env set to be present so the backend never falls back to local uploads.
- Production cutover stays production-only and follows this exact order: **apply infra -> push release tag / deploy -> run migrations -> run smoke verification**.
- The backend runtime `DATABASE_URL` is generated inside Terraform from the managed Railway Postgres service credentials.
- `BACKEND_DATABASE_URL` is now optional and only needed for operator workflows that connect directly from outside Railway.
- `task restore:drill:plan` prints an isolated restore-drill path that restores into a disposable target database instead of staging, then follows with app smoke checks.
