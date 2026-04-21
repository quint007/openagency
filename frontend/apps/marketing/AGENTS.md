<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Local notes

- Primary entrypoint: `src/app/page.tsx`.
- Page content is mostly data-driven from `src/app/homepage-content.ts`; update the content contract before scattering strings across section components.
- Section composition lives in `src/app/components/homepage/`; `src/app/page.module.css` should only hold visual styling like color, gradients, shadows, and typography.
- Shared primitives should come from `@open-agency/ui`; app-local wrappers like `Header`, `Hero`, and `BrandLockup` stay here.
- `apiClient.getLatestGuides()` is the current dynamic data seam for the homepage.
- In the marketing app, spacing and positioning belong inline in Tailwind utility classes on the JSX element itself. Use explicit `gap-*`, `px-*`, `py-*`, `mt-*`, `grid-cols-*`, `flex`, `grid`, `items-*`, and `justify-*` utilities rather than CSS-module spacing.
- Prefer flexbox first for marketing layouts. Use `flex`, `flex-col`, `flex-wrap`, and `justify-between` for page shells, section internals, card rows, CTA clusters, and footer/header structure; only reach for grid when the content genuinely needs two-dimensional placement.
- Spacing review is mandatory when editing homepage sections: check shell gutters, section padding, block gaps, card padding, CTA spacing, and footer rhythm instead of adjusting only the local element that feels off.
- Prefer shared section rhythms: large section wrappers should use a consistent vertical gap and padding scale, and nested blocks should use one smaller repeated gap scale rather than ad hoc one-off values.

## Anti-patterns

- Do not move shared primitives into this app when they belong in `frontend/packages/ui`.
- Do not bypass `homepage-content.ts` for large batches of homepage copy.
- Do not assume this app is still starter-template state; the root route is now custom and section-based.
- Do not add new margin, padding, gap, width/placement, or responsive layout rules to `page.module.css` for marketing components when inline Tailwind utilities can express them.
- Do not split spacing ownership between a JSX className and a CSS-module class for the same element; keep layout/spacing in JSX and keep page-module classes visual only.
- Do not introduce new grid-first section shells when a flex row/column structure would cover the same layout with less rigidity.
