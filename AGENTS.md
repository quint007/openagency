# PROJECT KNOWLEDGE BASE

**Generated:** 2026-04-09
**Commit:** a1cc8e8
**Branch:** contact/oa-6-oa-003-brand-system-and-design-tokens

## OVERVIEW
Open Agency is a monorepo for the platform site stack: a Turborepo-based frontend workspace, a standalone Payload CMS backend, a separate brand/design-system playground, and thin infra/docs/CI support directories.
The real operational source of truth is the root Taskfile plus `docs/contributing.md`; architecture docs are currently placeholders.

## STRUCTURE
```text
openagency/
├── frontend/               # Turborepo workspace: apps + shared packages
├── backend/openagency-backend/  # Payload CMS app; already has deep local AGENTS.md
├── Brand OpenAgency/       # Separate Vite brand/design playground; path contains spaces
├── infra/                  # OpenTofu env/module skeletons
├── docs/                   # Contributing is useful; architecture/runbook are TODO
├── scripts/                # Real setup/dev entrypoints used by Taskfile
├── ci/                     # Supplemental task/pipeline definitions
└── .opencode/              # Agent policy; devbox-first guidance lives here
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Local setup | `Taskfile.yml`, `docs/contributing.md`, `scripts/setup.sh` | Root workflow; prefer task commands |
| Start full stack | `Taskfile.yml` | Root dev task clears app ports, verifies Postgres, starts backend on `3002`, then runs the frontend workspace |
| Frontend app work | `frontend/AGENTS.md` | Workspace-level build/test/package rules |
| Shared design system | `frontend/packages/ui/AGENTS.md` | Tokens, theme CSS, exported primitives |
| Shared frontend API client | `frontend/packages/api-client/AGENTS.md` | Payload-facing fetch and mapping boundary |
| Payload/backend work | `backend/openagency-backend/AGENTS.md` | Most detailed local rules already exist |
| Brand playground | `Brand OpenAgency/AGENTS.md` | Separate package; quote paths with spaces |
| Infra work | `infra/AGENTS.md` | Distinct domain, currently minimal docs |

## CODE MAP
| Symbol/File | Role | Location |
|-------------|------|----------|
| `buildConfig(...)` | Payload system root | `backend/openagency-backend/src/payload.config.ts` |
| `Home()` | Marketing homepage composition | `frontend/apps/marketing/src/app/page.tsx` |
| `ApiClient` | Shared frontend API wrapper | `frontend/packages/api-client/src/index.ts` |
| `tokens` | Shared TS design tokens | `frontend/packages/ui/src/tokens/index.ts` |
| `theme.css` | Shared CSS theme variables | `frontend/packages/ui/src/theme.css` |
| `App()` | Brand playground/demo entry | `Brand OpenAgency/src/app/App.tsx` |

## CONVENTIONS
- Prefer `devbox run task ...` at repo level. Treat devbox + Taskfile as the repo-default command surface.
- Prefer root `Taskfile.yml` over ad hoc commands; `docs/contributing.md` is the real onboarding doc.
- Frontend is a workspace under `frontend/`; backend is **not** part of that workspace.
- `frontend/apps/*/AGENTS.md` may carry narrow app-local guidance; do not overwrite them with generic root advice.
- `docs/architecture.md` and `docs/runbook.md` are placeholders; derive structure from code, not docs.

## ANTI-PATTERNS (THIS PROJECT)
- Do not run recurring workflow commands via random shell aliases or a new `Makefile`; root policy is Taskfile-first.
- Do not ignore the existing local AGENTS files. Backend and app-level guidance is intentionally more specific than root guidance.
- Do not assume the backend shares frontend workspace tooling; commands, tests, and package roots differ.
- Do not forget to quote `Brand OpenAgency/...` paths in shell commands.
- Do not treat placeholder docs as authoritative architecture.

## UNIQUE STYLES
- Root guidance should stay orchestration-focused: point contributors to the right module, not re-document every subproject.
- Child AGENTS files should add local rules only; avoid duplicating parent sections verbatim.

## COMMANDS
```bash
devbox run task setup
devbox run task dev
devbox run task dev-frontend
devbox run task dev-backend
devbox run pnpm --dir frontend build
devbox run pnpm --dir frontend test
devbox run pnpm --dir backend/openagency-backend lint
```

## NOTES
- `scripts/setup.sh` installs frontend and backend separately, copies env examples, starts Postgres, then runs Payload migrations.
- Root `task dev` now performs runtime preflight in `Taskfile.yml`, then starts the backend and frontend workspace together.
- Several repo artifacts (`session-ses_2930.md`, screenshots, task files) are session output, not product code.
