import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { CookieConsent } from "../src/app/components/CookieConsent";

vi.mock("../src/app/components/CookieConsent/cookie-config", () => ({
  cookieIntegrationConfig: {
    adsenseClientId: "ads-test-client",
    googleAnalyticsId: "",
    hasAds: true,
    hasAnalytics: false,
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

beforeEach(() => {
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: () => null,
      setItem: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    },
  });
});

afterEach(() => {
  document.querySelectorAll("#google-adsense-script").forEach((script) => script.remove());
  vi.restoreAllMocks();
});

test("ads-only configuration mounts advertising but never analytics scripts", () => {
  render(
    <CookieConsent>
      <p>Page content</p>
    </CookieConsent>,
  );

  fireEvent.click(screen.getByRole("button", { name: "Accept all" }));

  expect(screen.queryByTestId("google-analytics-script")).toBeNull();
  expect(document.querySelectorAll("#google-adsense-script")).toHaveLength(1);
});
