"use client";

import type { ReactNode } from "react";

import { CookieBanner } from "./CookieBanner";
import { CookieConsentScripts } from "./CookieConsentScripts";
import { CookiePreferences } from "./CookiePreferences";
import { CookieConsentProvider, useCookieConsent } from "./context";
import { cookieIntegrationConfig } from "./cookie-config";

function CookieSettingsTrigger() {
  const { hasDecided, isHydrated, openPreferences } = useCookieConsent();
  const optionalSettingsAreAvailable = cookieIntegrationConfig.hasOptionalIntegrations;

  if (!isHydrated || !hasDecided || !optionalSettingsAreAvailable) {
    return null;
  }

  return (
    <button
      type="button"
      className="fixed right-4 bottom-0 z-[60] rounded-full border border-[color:color-mix(in_srgb,var(--outline-variant)_55%,transparent)] bg-[color:color-mix(in_srgb,var(--surface-container-highest)_96%,transparent)] px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] text-[var(--on-surface-variant)] shadow-[0_12px_28px_color-mix(in_srgb,var(--brand-primary)_10%,transparent)] backdrop-blur-xl transition-colors hover:border-[color:color-mix(in_srgb,var(--brand-primary)_55%,transparent)] hover:text-[var(--on-surface)] focus-visible:border-[var(--brand-primary)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[color:color-mix(in_srgb,var(--brand-primary)_30%,transparent)] sm:bottom-20"
      onClick={openPreferences}
      data-cookie-settings="true"
    >
      Cookie settings
    </button>
  );
}

export function CookieConsent({ children }: { children: ReactNode }) {
  return (
    <CookieConsentProvider>
      {children}
      <CookieConsentScripts />
      <CookieBanner />
      <CookiePreferences />
      <CookieSettingsTrigger />
    </CookieConsentProvider>
  );
}
