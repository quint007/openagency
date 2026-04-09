# FRONTEND WORKSPACE KNOWLEDGE BASE

## OVERVIEW
`frontend/` is a pnpm workspace plus Turborepo root for the marketing app, courses app, and shared packages.

## STRUCTURE
```text
frontend/
├── apps/marketing/         # Main public site; active implementation surface
├── apps/courses/           # Secondary app; still mostly starter/template state
├── packages/ui/            # Shared tokens, theme CSS, exported UI primitives
├── packages/api-client/    # Shared API wrapper for Payload data
├── pnpm-workspace.yaml     # Canonical workspace membership
├── turbo.json              # Task graph and cache behavior
├── vitest.config.mts       # Shared unit-test config
└── playwright.config.ts    # Marketing E2E config
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Marketing homepage | `apps/marketing/src/app/page.tsx` | Composes sections from `homepage-content.ts` |
| Shared homepage data | `apps/marketing/src/app/homepage-content.ts` | Typed content contract for header/hero/sections |
| Shared UI primitives | `packages/ui/src/index.ts` | Public export surface |
| Theme variables | `packages/ui/src/theme.css` | Brand tokens mapped into CSS variables |
| Backend fetch wrapper | `packages/api-client/src/index.ts` | Uses `NEXT_PUBLIC_API_URL` |
| Workspace membership | `pnpm-workspace.yaml` | Defines apps/packages that belong to this workspace |
| Workspace tasks | `package.json`, `turbo.json`, `vitest.config.mts` | Canonical build/test flow |
| Shared API boundary | `packages/api-client/AGENTS.md` | Local guidance for fetch + mapping package |

## CONVENTIONS
- Root command surface: `pnpm --dir frontend ...`; workspace scripts proxy into Turbo.
- `vitest.config.mts` tests `packages/ui` and `apps/marketing`; `apps/courses` currently has no dedicated test surface.
- Playwright config targets marketing only via `apps/marketing/tests/e2e`.
- `@/` alias in shared frontend tests points at `packages/ui/src/`.
- App-local AGENTS files are intentionally narrow and may contain framework warnings that should remain in place.

## ANTI-PATTERNS
- Do not add duplicated design tokens in app code when they already belong in `packages/ui`.
- Do not treat `apps/courses` as feature-complete; it is still close to starter-template state.
- Do not bypass Turbo/workspace scripts for routine build/test flows without a reason.
- Do not put shared fetch logic directly in marketing when `packages/api-client` is the package boundary.

## COMMANDS
```bash
pnpm --dir frontend dev
pnpm --dir frontend build
pnpm --dir frontend lint
pnpm --dir frontend test
pnpm --dir frontend test:ui
pnpm --dir frontend test:e2e
```

## NOTES
- Marketing and courses run on separate ports via env files described in `docs/contributing.md`.
- Workspace outputs include `.next/**` and `dist/**` per `turbo.json`.
