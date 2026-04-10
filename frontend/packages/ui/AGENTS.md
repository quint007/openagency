# UI PACKAGE KNOWLEDGE BASE

## OVERVIEW
`packages/ui` is the shared design-system package for frontend apps: TS tokens, CSS theme variables, and exported UI primitives.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Public exports | `src/index.ts` | Controls package API surface |
| Typed tokens | `src/tokens/index.ts` | Color, spacing, radius, shadow, layout constants |
| CSS theme vars | `src/theme.css` | Brand palette, surface tokens, radius, typography hooks |
| Shared helpers | `src/lib/utils.ts` | `cn()` and local helpers |
| Navigation primitive | `src/components/ui/navigation-menu.tsx` | Heaviest component; client component |

## CONVENTIONS
- Keep reusable primitives here; app-local composition belongs in app directories.
- `package.json#exports` defines the package contract, with `src/index.ts` as the main barrel. Export intentionally; avoid leaking internal-only files.
- Theme is dark-first and brand-specific: cyan primary, mint success, zero-radius defaults, surface-layer hierarchy.
- Components use Tailwind utility classes plus CSS-variable-driven colors defined in `theme.css`.

## ANTI-PATTERNS
- Do not redefine tokens independently in consumer apps unless the divergence is intentionally app-local.
- Do not introduce rounded defaults casually; current theme sets `--radius: 0px` and the brand language assumes sharp corners.
- Do not add shared UI components without exporting them if apps are expected to consume them.
- Do not move app-specific content/data objects into this package.

## COMMANDS
```bash
pnpm --dir frontend/packages/ui lint
pnpm --dir frontend/packages/ui typecheck
pnpm --dir frontend test:ui
```

## NOTES
- Current exported primitives are intentionally small: alert, badge, button, card, input, navigation menu, separator, and container text flip.
- `navigation-menu.tsx` depends on `@base-ui/react/navigation-menu` and is a client component.
