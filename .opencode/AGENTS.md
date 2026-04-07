# Open Agency - Agent Instructions

## Important: Use Devbox

**ALL commands must be run using `devbox run` instead of running them directly.**

Instead of:
```bash
pnpm install
pnpm dev
pnpm build
```

Always use:
```bash
devbox run pnpm install
devbox run pnpm dev
devbox run pnpm build
```

This ensures all commands run in the correct devbox environment with all dependencies available.

## Available Commands

Use `devbox run` with any of the following:

- `devbox run pnpm install` - Install all dependencies
- `devbox run pnpm --dir frontend dev` - Start frontend development servers
- `devbox run pnpm --dir backend dev` - Start backend development server
- `devbox run pnpm --dir frontend build` - Build frontend
- `devbox run pnpm --dir backend build` - Build backend
- `devbox run pnpm --dir frontend lint` - Lint frontend

Or use the Taskfile tasks with `devbox run task <task-name>`:
- `devbox run task install` - Install all dependencies
- `devbox run task run:dev` - Start all development servers
- `devbox run task build` - Build all projects
- `devbox run task lint` - Lint all projects

## Taskfile-first policy

Whenever a command needs to be run frequently (setup, dev workflows, migrations, etc.), add a task to `Taskfile.yml` rather than introducing a `Makefile` or ad hoc alias. This keeps the workflow centralized and surfaced through `task <name>` (and `devbox run task <name>`). Do not re-create a Makefile while this policy is in effect.
