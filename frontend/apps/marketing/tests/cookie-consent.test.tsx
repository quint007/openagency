import type { ReactNode } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { CookieConsent } from "../src/app/components/CookieConsent";
import { getCookieIntegrationConfig } from "../src/app/components/CookieConsent/cookie-config";

vi.mock("next/script", () => ({
  default: ({ children, id, src }: { children?: ReactNode; id: string; src?: string }) => (
    <span data-testid={id} data-src={src}>
      {children}
    </span>
  ),
}));

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
});

test("unconfigured consent does not advertise optional categories", () => {
  render(
    <CookieConsent>
      <p>Page content</p>
    </CookieConsent>,
  );

  const banner = screen.getByRole("region", { name: "Choose your cookie settings" });

  expect(banner.textContent ?? "").not.toMatch(/analytics|advertising/i);

  fireEvent.click(within(banner).getByRole("button", { name: "Manage preferences" }));

  const dialog = screen.getByRole("dialog", { name: "Manage your preferences" });
  expect(within(dialog).getByText("Essential")).toBeTruthy();
  expect(within(dialog).queryByText("Analytics")).toBeNull();
  expect(within(dialog).queryByText("Advertising")).toBeNull();
});
