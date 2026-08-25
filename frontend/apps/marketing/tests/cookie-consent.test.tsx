import type { ReactNode } from "react";
import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import {
  COOKIE_CONSENT_STORAGE_KEY,
  CookieConsent,
  CookieConsentProvider,
  DEFAULT_COOKIE_CONSENT,
  normalizeCookieConsent,
  useCookieConsent,
} from "../src/app/components/CookieConsent";
import { getCookieIntegrationConfig } from "../src/app/components/CookieConsent/cookie-config";

vi.mock("next/script", () => ({
  default: ({ children, id, src }: { children?: ReactNode; id: string; src?: string }) => (
    <span data-testid={id} data-src={src}>
      {children}
    </span>
  ),
}));

function ConsentProbe() {
  const { consent, updateConsent } = useCookieConsent();

  return (
    <>
      <output data-testid="consent">{JSON.stringify(consent)}</output>
      <button type="button" onClick={() => updateConsent(DEFAULT_COOKIE_CONSENT)}>
        Revoke optional consent
      </button>
    </>
  );
}

beforeEach(() => {
  const values = new Map<string, string>();

  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      clear: () => values.clear(),
      getItem: (key: string) => values.get(key) ?? null,
      removeItem: (key: string) => values.delete(key),
      setItem: (key: string, value: string) => values.set(key, value),
    },
  });
});

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

test("cookie integration configuration only exposes configured optional categories", () => {
  const config = getCookieIntegrationConfig({
    NEXT_PUBLIC_ADSENSE_CLIENT_ID: " ads-test-client ",
    NEXT_PUBLIC_GA_ID: " G-TEST ",
  });

  expect(config).toEqual({
    adsenseClientId: "ads-test-client",
    googleAnalyticsId: "G-TEST",
    hasAds: true,
    hasAnalytics: true,
    hasOptionalIntegrations: true,
  });

  expect(
    getCookieIntegrationConfig({
      NEXT_PUBLIC_ADSENSE_CLIENT_ID: "",
      NEXT_PUBLIC_GA_ID: undefined,
    }),
  ).toEqual({
    adsenseClientId: "",
    googleAnalyticsId: "",
    hasAds: false,
    hasAnalytics: false,
    hasOptionalIntegrations: false,
  });

  expect(
    getCookieIntegrationConfig({ NEXT_PUBLIC_GA_ID: "G-ONLY" }),
  ).toMatchObject({ hasAnalytics: true, hasAds: false });
  expect(
    getCookieIntegrationConfig({ NEXT_PUBLIC_ADSENSE_CLIENT_ID: "ads-only" }),
  ).toMatchObject({ hasAnalytics: false, hasAds: true });

  expect(
    normalizeCookieConsent(
      { essential: true, analytics: true, ads: true },
      getCookieIntegrationConfig({ NEXT_PUBLIC_GA_ID: "G-ONLY" }),
    ),
  ).toEqual({ essential: true, analytics: true, ads: false });
});

test("unconfigured consent does not advertise optional categories", () => {
  render(
    <CookieConsent>
      <p>Page content</p>
    </CookieConsent>,
  );

  const banner = screen.getByRole("region", { name: "Choose your cookie settings" });

  expect(banner.textContent ?? "").not.toMatch(/analytics|advertising/i);
  expect(within(banner).queryByRole("button", { name: "Accept all" })).toBeNull();
  expect(within(banner).queryByRole("button", { name: "Manage preferences" })).toBeNull();
});

test("stale legacy grants are masked and migrated to the versioned storage contract", () => {
  window.localStorage.setItem(
    COOKIE_CONSENT_STORAGE_KEY,
    JSON.stringify({ essential: true, analytics: true, ads: true }),
  );

  render(
    <CookieConsentProvider>
      <ConsentProbe />
    </CookieConsentProvider>,
  );

  expect(screen.getByTestId("consent").textContent).toBe(
    JSON.stringify(DEFAULT_COOKIE_CONSENT),
  );
  expect(window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY)).toBe(
    JSON.stringify({ version: 1, consent: DEFAULT_COOKIE_CONSENT }),
  );
});
