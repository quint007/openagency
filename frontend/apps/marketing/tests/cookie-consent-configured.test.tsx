import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { CookieConsent } from "../src/app/components/CookieConsent";

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

afterEach(() => {
  document.querySelectorAll("#google-adsense-script").forEach((script) => script.remove());
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
