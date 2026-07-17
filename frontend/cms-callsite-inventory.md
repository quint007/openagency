# OA-15 CMS call-site inventory

## Current findings

- `frontend/apps/marketing`: no direct Payload REST consumers found.
- `frontend/apps/courses`: no direct Payload REST consumers found.
- `frontend/apps/marketing/src/app/components/homepage/LatestGuidesSection.tsx` remains a static seam, not a live CMS call.

## Generated type boundary

- Use `frontend/packages/cms-client/src/payload-types-public.ts` as the frontend import surface for generated Payload types.
- The cms-client package mirrors the backend-owned `backend/openagency-backend/src/payload-types-public.ts` so the frontend build is self-contained.
- Do not deep import `backend/openagency-backend/src/payload-types.ts` from frontend apps or packages.
