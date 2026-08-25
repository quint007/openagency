import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("../src/app/(resources)/ResourceIndexPage", () => ({
  ResourceIndexPage: ({ children, intro, title }: { children: ReactNode; intro: string; title: string }) => (
    <main>
      <h1>{title}</h1>
      <p>{intro}</p>
      {children}
    </main>
  ),
}));

test("about page renders site purpose and contact path", async () => {
  const { default: AboutPage } = await import("../src/app/about/page");

  render(<AboutPage />);

  expect(screen.getByRole("heading", { name: "About" })).toBeTruthy();
  expect(screen.getByText(/practical AI guides and tools/i)).toBeTruthy();
  expect(screen.getByRole("link", { name: "hello@open-agency.io" }).getAttribute("href")).toBe(
    "mailto:hello@open-agency.io",
  );
});
