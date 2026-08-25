"use client";

import { Button } from "@open-agency/ui";

import { cookieIntegrationConfig } from "./cookie-config";
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

  const optionalDescriptionParts = [
    cookieIntegrationConfig.hasAnalytics ? "analytics cookies help us understand visits" : null,
    cookieIntegrationConfig.hasAds ? "advertising cookies support the site" : null,
  ].filter((description): description is string => description !== null);
  const optionalDescription = optionalDescriptionParts.length > 0
    ? `With your permission, ${optionalDescriptionParts.join(" and ")}.`
    : "This site currently uses only essential cookies to keep Open Agency working.";

  return (
    <section
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto flex max-w-[72rem] flex-col gap-4 rounded-[1.5rem] border border-[color:color-mix(in_srgb,var(--outline-variant)_55%,transparent)] bg-[color:color-mix(in_srgb,var(--surface-container-highest)_96%,transparent)] p-4 shadow-[0_18px_48px_color-mix(in_srgb,var(--brand-primary)_12%,transparent)] backdrop-blur-xl sm:inset-x-6 sm:bottom-4 sm:gap-5 sm:p-6 sm:pr-44 lg:flex-row lg:items-center lg:justify-between"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
      data-cookie-banner="true"
    >
      <div className="flex max-w-[42rem] flex-col gap-2">
        <h2 id="cookie-consent-title" className="font-[var(--brand-font-heading)] text-lg font-semibold tracking-[-0.03em] text-[var(--on-surface)]">
          Choose your cookie settings
        </h2>
        <p id="cookie-consent-description" className="text-sm leading-7 text-[var(--on-surface-variant)]">
          {optionalDescription} <a className="text-[var(--brand-primary-light)] underline underline-offset-4 hover:text-[var(--on-surface)]" href="/privacy/cookies">Read the cookie policy</a>
        </p>
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 lg:justify-end">
        {cookieIntegrationConfig.hasOptionalIntegrations ? (
          <Button className="min-h-11 px-5" onClick={acceptAll}>
            Accept all
          </Button>
        ) : null}
        <Button className="min-h-11 px-5" variant="outline" onClick={acceptEssentialOnly}>
          Essential only
        </Button>
        {cookieIntegrationConfig.hasOptionalIntegrations ? (
          <Button className="col-span-2 min-h-11 px-5 sm:col-span-1" variant="ghost" onClick={openPreferences}>
            Manage preferences
          </Button>
        ) : null}
      </div>
    </section>
  );
}
