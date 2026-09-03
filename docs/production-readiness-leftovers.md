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
- The tagged backend image checks and applies pending migrations before the
  server starts. New migrations must follow the documented expand-and-contract
  policy, require a confirmed restore point, and keep the backend at one replica
  until a singleton migration runner is managed by infrastructure.
- The `20260603_190000_blog_post_level.json` migration metadata is now complete,
  but the migration should still be verified to have run in each environment.

## Newsletter

- The newsletter now uses inbox confirmation, a private first-party consent
  ledger, lifecycle generations, and durable opaque unsubscribe credentials.
  Keep `NEWSLETTER_ENABLED=false` until the legal and operational prerequisites
  below are complete. Configure `NEWSLETTER_SERVICE_SECRET`,
  `NEWSLETTER_TOKEN_ENCRYPTION_KEY`, `NEWSLETTER_PRIVACY_VERSION`, `RESEND_API_KEY`,
  `RESEND_AUDIENCE_ID`, and `BACKEND_CRON_SECRET`; archive the approved notice
  identified by that version, deploy the schema migration, and verify the 15-minute
  `newsletter-maintenance.yml` workflow; then enable collection and test an
  end-to-end production confirmation, resubscription, browser unsubscribe, and
  RFC 8058 one-click unsubscribe flow.
- Production keeps `NEWSLETTER_WITHDRAWAL_REQUIRED=true` even while collection
  is paused. This makes startup fail if the service secret or Resend withdrawal
  configuration is removed after subscription state exists. Treat a failed
  maintenance workflow as an outstanding delivery or synchronization backlog.
- Generate `NEWSLETTER_TOKEN_ENCRYPTION_KEY` as 32 random base64url-encoded bytes
  and retain it in the production secret store. Changing or losing it invalidates
  the encrypted unsubscribe credentials retained for active subscribers; key
  rotation requires a separate migration plan.
- Confirm with Resend that `List-Unsubscribe` and `List-Unsubscribe-Post` are
  covered by DKIM, and do not send a broadcast while provider synchronization
  failures are outstanding.
- Do not import existing Resend contacts as consented. Only subscriptions with a
  matching first-party confirmation event may be projected into the broadcast
  audience; legacy contacts need a separately approved re-permission process.
- Public requests are throttled using short-lived HMAC-pseudonymized requester
  buckets. Verify the deployment proxy preserves one of the supported client-IP
  headers without allowing clients to spoof the trusted value.
- Approve and operate the retention schedule for pending requests, consent
  evidence, and suppression records. The privacy notice still requires final
  review of the controller identity/contact details, transfer assessment, and
  supervisory-authority wording before collection is enabled for EU users.

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

## General

- Homepage content in `homepage-content.ts` and `DESIGN.md` should be reviewed by
  stakeholders before launch.
- The new sitemap, robots, manifest, and favicon route handlers assume a single
  locale; revisit if multi-locale support is added later.
