# OA-15 CMS call-site inventory

## Current findings

- `frontend/apps/marketing`: no direct Payload REST consumers found.
- `frontend/apps/courses`: no direct Payload REST consumers found.
- `frontend/apps/marketing/src/app/components/homepage/LatestGuidesSection.tsx` remains a static seam, not a live CMS call.

## Generated type boundary

- Use `backend/openagency-backend/src/payload-types-public.ts` as the backend-owned import surface for generated Payload types.
- Do not deep import `backend/openagency-backend/src/payload-types.ts` from frontend apps or packages.
