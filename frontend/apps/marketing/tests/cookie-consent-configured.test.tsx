import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import {
  COOKIE_CONSENT_STORAGE_KEY,
  CookieConsent,
  CookieConsentProvider,
  useCookieConsent,
} from "../src/app/components/CookieConsent";

const { reloadPageMock } = vi.hoisted(() => ({
  reloadPageMock: vi.fn(),
}));

vi.mock("../src/app/components/CookieConsent/cookie-config", () => ({
  cookieIntegrationConfig: {
    adsenseClientId: "ads-test-client",
    googleAnalyticsId: "G-TEST",
    hasAds: true,
    hasAnalytics: true,
    hasOptionalIntegrations: true,
  },
}));

vi.mock("next/script", () => ({
  default: ({ children, id, src }: { children?: ReactNode; id: string; src?: string }) => (
    <span data-testid={id} data-src={src}>
      {children}
    </span>
  ),
}));

vi.mock("../src/app/components/CookieConsent/browser", () => ({
  reloadPage: reloadPageMock,
}));

function ConsentProbe() {
  const { consent, updateConsent } = useCookieConsent();

  return (
    <>
      <output data-testid="consent">{JSON.stringify(consent)}</output>
      <button type="button" onClick={() => updateConsent({ analytics: false })}>
        Revoke analytics consent
      </button>
      <button type="button" onClick={() => updateConsent({ ads: false })}>
        Revoke ads consent
      </button>
    </>
  );
}

beforeEach(() => {
  reloadPageMock.mockReset();
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
  document.querySelectorAll("#google-adsense-script").forEach((script) => script.remove());
  vi.restoreAllMocks();
});

test("configured consent keeps optional scripts out before and after essential-only choice", () => {
  render(
    <CookieConsent>
      <p>Page content</p>
    </CookieConsent>,
  );

  expect(screen.queryByTestId("google-analytics-script")).toBeNull();
  expect(document.querySelector("#google-adsense-script")).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: "Essential only" }));

  expect(screen.queryByTestId("google-analytics-script")).toBeNull();
  expect(document.querySelector("#google-adsense-script")).toBeNull();
});

test("configured consent mounts each accepted optional script once", () => {
  render(
    <CookieConsent>
      <p>Page content</p>
    </CookieConsent>,
  );

  fireEvent.click(screen.getByRole("button", { name: "Accept all" }));

  expect(screen.getAllByTestId("google-analytics-script")).toHaveLength(1);
  expect(document.querySelectorAll("#google-adsense-script")).toHaveLength(1);
});

test("persisted revocation reloads exactly once after writing the masked consent", () => {
  window.localStorage.setItem(
    COOKIE_CONSENT_STORAGE_KEY,
    JSON.stringify({
      version: 1,
      consent: { essential: true, analytics: true, ads: true },
    }),
  );
  const operations: string[] = [];
  const setItem = window.localStorage.setItem.bind(window.localStorage);
  vi.spyOn(window.localStorage, "setItem").mockImplementation((key, value) => {
    operations.push(`persist:${key}`);
    setItem(key, value);
  });
  reloadPageMock.mockImplementation(() => operations.push("reload"));

  render(
    <CookieConsentProvider>
      <ConsentProbe />
    </CookieConsentProvider>,
  );

  fireEvent.click(screen.getByRole("button", { name: "Revoke analytics consent" }));

  expect(screen.getByTestId("consent").textContent).toBe(
    JSON.stringify({ essential: true, analytics: false, ads: true }),
  );
  expect(operations).toEqual([`persist:${COOKIE_CONSENT_STORAGE_KEY}`, "reload"]);
  expect(reloadPageMock).toHaveBeenCalledTimes(1);
  expect(window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY)).toBe(
    JSON.stringify({
      version: 1,
      consent: { essential: true, analytics: false, ads: true },
    }),
  );
});

test("rerendering after a non-revoking update does not reload", () => {
  render(
    <CookieConsentProvider>
      <ConsentProbe />
    </CookieConsentProvider>,
  );

  fireEvent.click(screen.getByRole("button", { name: "Revoke analytics consent" }));

  expect(reloadPageMock).not.toHaveBeenCalled();
});
