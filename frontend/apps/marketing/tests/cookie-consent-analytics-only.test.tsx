import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { CookieConsent } from "../src/app/components/CookieConsent";

vi.mock("../src/app/components/CookieConsent/cookie-config", () => ({
  cookieIntegrationConfig: {
    adsenseClientId: "",
    googleAnalyticsId: "G-ANALYTICS",
    hasAds: false,
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
  vi.restoreAllMocks();
});

test("analytics-only configuration mounts analytics but never advertising scripts", () => {
  render(
    <CookieConsent>
      <p>Page content</p>
    </CookieConsent>,
  );

  fireEvent.click(screen.getByRole("button", { name: "Accept all" }));

  expect(screen.getAllByTestId("google-analytics-script")).toHaveLength(1);
  expect(document.querySelector("#google-adsense-script")).toBeNull();
});
