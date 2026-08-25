"use client";

import { Button } from "@open-agency/ui";
import { useEffect, useState } from "react";

import { cookieIntegrationConfig } from "./cookie-config";
import { useCookieConsent } from "./context";

type PreferenceDraft = {
  analytics: boolean;
  ads: boolean;
};

export function CookiePreferences() {
  const { closePreferences, consent, isPreferencesOpen, updateConsent } = useCookieConsent();
  const [draft, setDraft] = useState<PreferenceDraft | null>(null);

  useEffect(() => {
    if (!isPreferencesOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closePreferences();
      }
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closePreferences, isPreferencesOpen]);

  if (!isPreferencesOpen) {
    return null;
  }

  const currentDraft = draft ?? { analytics: consent.analytics, ads: consent.ads };
  const preferencesDescription = cookieIntegrationConfig.hasOptionalIntegrations
    ? "Choose which optional cookies Open Agency may use. Your choices are saved in this browser and can be changed at any time."
    : "This site currently uses only essential cookies. Your choice is saved in this browser and can be changed at any time.";

  function closeAndReset() {
    setDraft(null);
    closePreferences();
  }

  function updateDraft(update: PreferenceDraft) {
    setDraft(update);
  }

  function savePreferences() {
    updateConsent(currentDraft);
    setDraft(null);
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[color:color-mix(in_srgb,var(--surface-container-lowest)_78%,transparent)] p-4 backdrop-blur-sm sm:items-center sm:p-6" role="presentation">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={closeAndReset}
        aria-label="Close cookie preferences"
      />
      <section
        className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-[38rem] flex-col gap-6 overflow-y-auto rounded-[1.75rem] border border-[color:color-mix(in_srgb,var(--outline-variant)_55%,transparent)] bg-[var(--surface-container)] p-6 shadow-[0_24px_64px_color-mix(in_srgb,var(--brand-primary)_16%,transparent)] sm:max-h-[calc(100dvh-3rem)] sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-preferences-title"
        aria-describedby="cookie-preferences-description"
      >
        <header className="flex flex-col gap-3">
          <span className="inline-flex self-start rounded-full bg-[color:color-mix(in_srgb,var(--brand-primary)_12%,var(--surface-container-low)_88%)] px-3 py-2 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-[var(--brand-primary-light)]">
            Cookie settings
          </span>
          <h2 id="cookie-preferences-title" className="font-[var(--brand-font-heading)] text-2xl font-semibold tracking-[-0.04em] text-[var(--on-surface)]">
            Manage your preferences
          </h2>
          <p id="cookie-preferences-description" className="text-sm leading-7 text-[var(--on-surface-variant)]">
            {preferencesDescription}
          </p>
        </header>

        <div className="flex flex-col gap-3">
          <label className="flex items-start justify-between gap-4 rounded-2xl border border-[color:color-mix(in_srgb,var(--outline-variant)_38%,transparent)] bg-[var(--surface-container-lowest)] p-4">
            <span className="flex flex-col gap-1">
              <span className="font-[var(--brand-font-heading)] text-base font-semibold text-[var(--on-surface)]">Essential</span>
              <span className="text-sm leading-6 text-[var(--on-surface-variant)]">Required for navigation, security, and remembering this choice.</span>
            </span>
            <input className="mt-1 size-4 shrink-0 accent-[var(--brand-primary)]" type="checkbox" checked readOnly aria-label="Essential cookies always enabled" />
          </label>

          {cookieIntegrationConfig.hasAnalytics ? (
            <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-[color:color-mix(in_srgb,var(--outline-variant)_38%,transparent)] bg-[var(--surface-container-lowest)] p-4 transition-colors hover:border-[color:color-mix(in_srgb,var(--brand-primary)_45%,transparent)]">
              <span className="flex flex-col gap-1">
                <span className="font-[var(--brand-font-heading)] text-base font-semibold text-[var(--on-surface)]">Analytics</span>
                <span className="text-sm leading-6 text-[var(--on-surface-variant)]">Helps us understand which pages are useful and how visitors use the site.</span>
              </span>
              <input
                className="mt-1 size-4 shrink-0 accent-[var(--brand-primary)]"
                type="checkbox"
                checked={currentDraft.analytics}
                onChange={(event) => updateDraft({ ...currentDraft, analytics: event.target.checked })}
                aria-label="Allow analytics cookies"
              />
            </label>
          ) : null}

          {cookieIntegrationConfig.hasAds ? (
            <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-[color:color-mix(in_srgb,var(--outline-variant)_38%,transparent)] bg-[var(--surface-container-lowest)] p-4 transition-colors hover:border-[color:color-mix(in_srgb,var(--brand-primary)_45%,transparent)]">
              <span className="flex flex-col gap-1">
                <span className="font-[var(--brand-font-heading)] text-base font-semibold text-[var(--on-surface)]">Advertising</span>
                <span className="text-sm leading-6 text-[var(--on-surface-variant)]">Allows advertising services such as Google AdSense to show relevant ads.</span>
              </span>
              <input
                className="mt-1 size-4 shrink-0 accent-[var(--brand-primary)]"
                type="checkbox"
                checked={currentDraft.ads}
                onChange={(event) => updateDraft({ ...currentDraft, ads: event.target.checked })}
                aria-label="Allow advertising cookies"
              />
            </label>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button className="min-h-11 px-5" variant="outline" onClick={closeAndReset}>
            Cancel
          </Button>
          <Button className="min-h-11 px-5" onClick={savePreferences}>
            Save choices
          </Button>
        </div>
      </section>
    </div>
  );
}
