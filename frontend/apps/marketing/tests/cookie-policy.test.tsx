import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("../src/app/components/CookieConsent/cookie-config", () => ({
  cookieIntegrationConfig: {
    adsenseClientId: "",
    googleAnalyticsId: "",
    hasAds: false,
    hasAnalytics: false,
    hasOptionalIntegrations: false,
  },
}));

vi.mock("../src/app/(resources)/ResourceIndexPage", () => ({
  ResourceIndexPage: ({ children, intro, title }: { children: ReactNode; intro: string; title: string }) => (
    <main>
      <h1>{title}</h1>
      <p>{intro}</p>
      {children}
    </main>
  ),
}));

vi.mock("../src/app/components/CookieConsent", () => ({
  CookiePreferencesButton: () => <button type="button">Review consent</button>,
}));

test("no-integration cookie policy explains that only essential cookies are used", async () => {
  const { default: CookiePreferencesPage } = await import(
    "../src/app/privacy/cookies/page"
  );

  render(<CookiePreferencesPage />);

  expect(screen.getByRole("heading", { name: "Cookie preferences" })).toBeTruthy();
  expect(screen.getByText("Open Agency currently uses only essential cookies. Your essential consent choice is saved in this browser.")).toBeTruthy();
  expect(screen.queryByText(/choose which optional cookies/i)).toBeNull();
});
