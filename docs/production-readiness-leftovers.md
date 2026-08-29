# Production-readiness leftovers

This document tracks known remaining work that was intentionally kept out of the
`feat/production-readiness-suite` PR so the branch stays focused on the current
set of product-relevant changes.

## Workspace hygiene

- The `courses` app currently has pre-existing lint errors that should be cleaned
  up independently of this work.

## CMS content and operations

- The `legal-documents` collection, migration, and marketing pages are in place,
  but the actual privacy policy and terms of service documents still need to be
  authored and published in the CMS for production.
- The `20260714_213520_legal_documents` migration must be run against the
  production database before the backend is deployed.
- The `20260603_190000_blog_post_level.json` migration metadata is now complete,
  but the migration should still be verified to have run in each environment.

## Newsletter

- Production Vercel wiring is in place for `RESEND_AUDIENCE_ID`,
  `NEWSLETTER_TOKEN_SECRET`, and `RESEND_API_KEY`. Configure the production
  values and verify that the Resend audience exists and matches the configured ID.
- The unsubscribe flow uses signed tokens; rotating `NEWSLETTER_TOKEN_SECRET`
  will invalidate all outstanding unsubscribe links.

## Feedback

- Production Vercel wiring is in place for `NOTION_TOKEN` and
  `NOTION_FEEDBACK_DATABASE_ID`, with `RESEND_API_KEY` as a delivery fallback.
  Configure at least one delivery path and verify a real production submission.

## Cookie consent and third-party scripts

- The cookie consent banner and production Vercel wiring are implemented for
  `NEXT_PUBLIC_GA_ID` and `NEXT_PUBLIC_ADSENSE_CLIENT_ID`. Decide which services
  to enable, configure their production IDs, and verify that scripts remain
  consent-gated.
- Review the cookie policy copy at `/privacy/cookies` for accuracy once the
  final third-party integrations are chosen.

## Next.js deprecation warnings

- The marketing app uses the `middleware` file convention, which Next.js 16
  reports as deprecated in favor of the `proxy` convention. This should be
  migrated before it becomes a hard error in a future Next.js release.

## General

- Homepage content in `homepage-content.ts` and `DESIGN.md` should be reviewed by
  stakeholders before launch.
- The new sitemap, robots, manifest, and favicon route handlers assume a single
  locale; revisit if multi-locale support is added later.
