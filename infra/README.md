# Infrastructure

This directory contains the OpenTofu configuration for Open Agency production infrastructure.

## Structure

- `environments/production/` - production composition and state backend contract
- `modules/` - Railway, Vercel, Cloudflare DNS, and R2 modules

## Getting Started

Use Devbox and the root Taskfile so local and CI commands share the same toolchain. Start from the repository root `.env.example`, then configure the required provider credentials and production values outside version control.

```bash
devbox run task production:deploy:init
devbox run task deploy:plan
devbox run task deploy:apply
```

Validate formatting and configuration directly when editing OpenTofu:

```bash
devbox run task production:deploy:init
devbox run tofu -chdir=infra/environments/production fmt -check -recursive
devbox run tofu -chdir=infra/environments/production validate
```

The repository currently models production only. Do not commit backend credentials, `.terraform/` directories, generated plans, or state files, and do not hand-edit remote state.

See [`environments/production/README.md`](environments/production/README.md) for prerequisites, deployment order, DNS/media cutover, rollback procedures, and the isolated restore drill. See [`../ci/README.md`](../ci/README.md) for the GitHub production environment contract.
