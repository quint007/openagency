import { render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { homepageContent } from "../src/app/homepage-content";
import Home from "../src/app/page";

const { getBlogPostsMock } = vi.hoisted(() => ({
  getBlogPostsMock: vi.fn(),
}));

vi.mock("@open-agency/cms-client", () => ({
  getBlogPosts: getBlogPostsMock,
}));

afterEach(() => {
  vi.clearAllMocks();
});

test("latest guides section renders cms-client blog data on the homepage", async () => {
  getBlogPostsMock.mockResolvedValue([
    {
      category: { id: 12, title: "Operations" },
      excerpt: "A practical structure for approvals, revisions, and sign-off.",
      id: 101,
      publishedAt: "2026-04-01T12:00:00.000Z",
      slug: "human-review-loops",
      title: "Human review loops that keep AI output calm and accountable",
    },
  ]);

  render(await Home());

  const section = screen.getByRole("region", { name: homepageContent.latestGuides.title });

  expect(within(section).getByText(homepageContent.latestGuides.description)).toBeTruthy();
  expect(
    within(section).getByRole("button", { name: homepageContent.latestGuides.cta.label }).getAttribute("href"),
  ).toBe(homepageContent.latestGuides.cta.href);
  expect(
    within(section).getByRole("heading", {
      name: "Human review loops that keep AI output calm and accountable",
      level: 3,
    }),
  ).toBeTruthy();
  expect(within(section).getByText("A practical structure for approvals, revisions, and sign-off.")).toBeTruthy();
  expect(within(section).getByText("Operations")).toBeTruthy();
  expect(within(section).getByText("Apr 1, 2026")).toBeTruthy();
  expect(
    within(section).getByRole("link", { name: /human review loops that keep ai output calm and accountable/i }).getAttribute("href"),
  ).toBe("/blog/human-review-loops");
  expect(within(section).getByRole("button", { name: "Previous post" })).toBeTruthy();
  expect(within(section).getByRole("button", { name: "Next post" })).toBeTruthy();
}, 10000);

test("latest guides section renders the homepage empty state when cms-client returns no posts", async () => {
  getBlogPostsMock.mockResolvedValue([]);

  render(await Home());

  const section = screen.getByRole("region", { name: homepageContent.latestGuides.title });

  expect(within(section).getByRole("heading", { name: homepageContent.latestGuides.empty.title, level: 3 })).toBeTruthy();
  expect(within(section).getByText(homepageContent.latestGuides.empty.body)).toBeTruthy();
  expect(
    within(section).getByRole("button", { name: homepageContent.latestGuides.empty.cta.label }).getAttribute("href"),
  ).toBe(homepageContent.latestGuides.empty.cta.href);
  expect(within(section).queryByRole("button", { name: "Previous post" })).toBeNull();
});

test("latest guides section renders the homepage error state when cms-client fails", async () => {
  getBlogPostsMock.mockRejectedValue(new Error("cms unavailable"));

  render(await Home());

  const section = screen.getByRole("region", { name: homepageContent.latestGuides.title });

  expect(within(section).getByRole("heading", { name: homepageContent.latestGuides.error.title, level: 3 })).toBeTruthy();
  expect(within(section).getByText(homepageContent.latestGuides.error.body)).toBeTruthy();
  expect(
    within(section).getByRole("button", { name: homepageContent.latestGuides.error.cta.label }).getAttribute("href"),
  ).toBe(homepageContent.latestGuides.error.cta.href);
  expect(within(section).queryByRole("heading", { name: /human review loops/i, level: 3 })).toBeNull();
});
