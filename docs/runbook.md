# Runbook

This page is the operational index. The detailed production procedure, including cutover order, rollback paths, migration handling, and the isolated restore drill, lives in [`../infra/environments/production/README.md`](../infra/environments/production/README.md).

## Local Stack

```bash
devbox run task setup
devbox run task dev
```

Use `devbox run task dev-frontend` or `devbox run task dev-backend` for a single workspace. Local setup and environment-file details are documented in [`contributing.md`](contributing.md).

## Production Infrastructure

Run plans before applies and review the generated OpenTofu changes:

```bash
devbox run task production:deploy:init
devbox run task deploy:plan
devbox run task deploy:apply
```

For a first cutover or a provider transition, use:

```bash
devbox run task cutover:plan
```

Do not edit state files or production resources manually to bypass the documented flow.

## Application Operations

```bash
devbox run task deploy:backend
devbox run task deploy:verify
```

Production releases are normally driven by a Git tag through `.github/workflows/deploy.yml`. The workflow gates the release with frontend/backend checks, applies infrastructure, deploys Vercel and Railway, and runs production smoke verification. The Railway image applies pending Payload migrations before serving; follow the expand-and-contract policy in the production infrastructure runbook and do not run a second post-deploy migration.

`devbox run task deploy:migrate` is reserved for incident recovery and diagnostics using the exact affected release and an operator-only database connection.

## Recovery

Plan the isolated database restore drill without touching production:

```bash
devbox run task restore:drill:plan
```

Use the rollback and restore sections in the [production infrastructure runbook](../infra/environments/production/README.md) during an incident. Record the affected release tag, migration state, provider status, and verification results before taking further action.

Backend application rollback uses `.github/workflows/rollback-backend.yml` with an immutable commit SHA. It deploys only Railway and verifies backend health; it never applies historical OpenTofu or rolls back marketing.

## Sources Of Truth

- [`../infra/environments/production/README.md`](../infra/environments/production/README.md): production topology, cutover, migrations, rollback, and restore
- [`../ci/README.md`](../ci/README.md): release workflow and GitHub production environment contract
- [`contributing.md`](contributing.md): local development and package commands
- [`architecture.md`](architecture.md): system boundaries and request flow
