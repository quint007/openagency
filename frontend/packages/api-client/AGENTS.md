# API CLIENT PACKAGE KNOWLEDGE BASE

## OVERVIEW
`packages/api-client` is the shared frontend boundary for Payload-facing fetch logic and response mapping.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Public API surface | `src/index.ts` | Main package entry |
| Guide-card mapping | `src/index.ts` | `mapPostToLatestGuideCard()` and related helpers |
| Runtime env dependency | `src/index.ts` | Requires `NEXT_PUBLIC_API_URL` |

## CONVENTIONS
- Keep backend request/response normalization here, not scattered across consuming apps.
- Throw hard on missing `NEXT_PUBLIC_API_URL`; consumers are expected to provide env correctly.
- Preserve typed mapping at the package boundary so apps receive stable view-model shapes.

## ANTI-PATTERNS
- Do not duplicate payload-to-view-model mapping logic in marketing or other apps.
- Do not let app-specific presentation copy leak into this package.
- Do not silently swallow missing API configuration; the package is intentionally strict.

## COMMANDS
```bash
pnpm --dir frontend/packages/api-client lint
pnpm --dir frontend/packages/api-client typecheck
```

## NOTES
- Current main consumer is the marketing homepage latest-guides section.
- This package is small today, but it is still a real ownership boundary inside the frontend workspace.
