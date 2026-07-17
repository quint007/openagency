"use client";

import { Button } from "@open-agency/ui";

import { useCookieConsent } from "./context";

export function CookieBanner() {
  const {
    acceptAll,
    acceptEssentialOnly,
    hasDecided,
    isHydrated,
    isPreferencesOpen,
    openPreferences,
  } = useCookieConsent();

  if (!isHydrated || hasDecided || isPreferencesOpen) {
    return null;
  }

  return (
    <section
      className="fixed inset-x-4 bottom-4 z-[60] mx-auto flex max-w-[72rem] flex-col gap-5 rounded-[1.5rem] border border-[color:color-mix(in_srgb,var(--outline-variant)_55%,transparent)] bg-[color:color-mix(in_srgb,var(--surface-container-highest)_96%,transparent)] p-5 pb-24 shadow-[0_18px_48px_color-mix(in_srgb,var(--brand-primary)_12%,transparent)] backdrop-blur-xl sm:inset-x-6 sm:p-6 sm:pr-44 sm:pb-6 lg:flex-row lg:items-center lg:justify-between"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
      data-cookie-banner="true"
    >
      <div className="flex max-w-[42rem] flex-col gap-2">
        <h2 id="cookie-consent-title" className="font-[var(--brand-font-heading)] text-lg font-semibold tracking-[-0.03em] text-[var(--on-surface)]">
          Choose your cookie settings
        </h2>
        <p id="cookie-consent-description" className="text-sm leading-7 text-[var(--on-surface-variant)]">
          Essential cookies keep Open Agency working. With your permission, analytics and advertising cookies help us understand visits and support the site. <a className="text-[var(--brand-primary-light)] underline underline-offset-4 hover:text-[var(--on-surface)]" href="/privacy/cookies">Read the cookie policy</a>.
        </p>
      </div>

      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
        <Button className="min-h-11 px-5" onClick={acceptAll}>
          Accept all
        </Button>
        <Button className="min-h-11 px-5" variant="outline" onClick={acceptEssentialOnly}>
          Essential only
        </Button>
        <Button className="min-h-11 px-5" variant="ghost" onClick={openPreferences}>
          Manage preferences
        </Button>
      </div>
    </section>
  );
}
