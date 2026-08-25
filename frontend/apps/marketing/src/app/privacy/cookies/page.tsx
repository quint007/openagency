import type { Metadata } from "next";

import { ResourceIndexPage } from "../../(resources)/ResourceIndexPage";
import { CookiePreferencesButton } from "../../components/CookieConsent";
import { cookieIntegrationConfig } from "../../components/CookieConsent/cookie-config";

export const metadata: Metadata = {
  alternates: { canonical: "/privacy/cookies" },
  description: "Manage the cookie categories used by Open Agency.",
  title: "Cookie preferences · Open Agency",
};

export default function CookiePreferencesPage() {
  const { hasAds, hasAnalytics, hasOptionalIntegrations } = cookieIntegrationConfig;

  return (
    <ResourceIndexPage
      eyebrow="Legal"
       intro={
         hasOptionalIntegrations
           ? "Choose which optional cookies Open Agency may use. Your choice is saved in this browser and can be updated whenever you like."
           : "Open Agency currently uses only essential cookies. Your essential consent choice is saved in this browser."
       }
      title="Cookie preferences"
    >
      <section className="px-4 sm:px-6 lg:px-8" aria-label="Cookie categories">
        <div className="mx-auto flex w-full max-w-[64rem] flex-col gap-8 rounded-[1.75rem] border border-[color:color-mix(in_srgb,var(--outline-variant)_45%,transparent)] bg-[color:color-mix(in_srgb,var(--surface-container-lowest)_86%,transparent)] px-6 py-7 text-[var(--on-surface-variant)] sm:px-8">
          <div className="flex flex-col gap-3">
            <h2 className="font-[var(--brand-font-heading)] text-2xl font-semibold tracking-[-0.04em] text-[var(--on-surface)]">Cookie categories</h2>
            <p className="text-base leading-8">
              {hasOptionalIntegrations
                ? "Cookies are small files stored by your browser. Open Agency uses the following categories:"
                : "Cookies are small files stored by your browser. This site currently uses only essential cookies."}
            </p>
          </div>

          <dl className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <dt className="font-[var(--brand-font-heading)] text-lg font-semibold text-[var(--on-surface)]">Essential</dt>
              <dd className="text-base leading-8">These cookies are required for core features such as navigation, security, and remembering your consent choice. They cannot be switched off.</dd>
            </div>
            {hasAnalytics ? (
              <div className="flex flex-col gap-2">
                <dt className="font-[var(--brand-font-heading)] text-lg font-semibold text-[var(--on-surface)]">Analytics</dt>
                <dd className="text-base leading-8">These cookies allow Google Analytics to measure visits and understand which pages and resources are useful. They are optional.</dd>
              </div>
            ) : null}
            {hasAds ? (
              <div className="flex flex-col gap-2">
                <dt className="font-[var(--brand-font-heading)] text-lg font-semibold text-[var(--on-surface)]">Advertising</dt>
                <dd className="text-base leading-8">These cookies allow Google AdSense to support advertising on the site. They are optional and are not loaded without your permission.</dd>
              </div>
            ) : null}
          </dl>

          <div className="flex flex-col gap-3 border-t border-[color:color-mix(in_srgb,var(--outline-variant)_45%,transparent)] pt-6">
            <p className="text-base leading-8">
              {hasOptionalIntegrations
                ? "You can reopen the preference panel to change your optional choices."
                : "You can reopen the preference panel to review your consent choice."}
            </p>
            <CookiePreferencesButton />
          </div>
        </div>
      </section>
    </ResourceIndexPage>
  );
}
