import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { CookieConsentProvider } from "../src/app/components/CookieConsent";
import { FeedbackButton, FeedbackProvider } from "../src/app/components/Feedback";
import { FooterSection } from "../src/app/components/homepage/FooterSection";
import { homepageContent } from "../src/app/homepage-content";

const fetchMock = vi.hoisted(() =>
  vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(),
);

const originalEnvironment = {
  notionToken: process.env.NOTION_TOKEN,
  databaseId: process.env.NOTION_FEEDBACK_DATABASE_ID,
};

function createFormData(fields: Readonly<Record<string, string>>): FormData {
  const formData = new FormData();

  for (const [name, value] of Object.entries(fields)) {
    formData.set(name, value);
  }

  return formData;
}

function restoreEnvironmentValue(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

beforeEach(() => {
  process.env.NOTION_TOKEN = "secret_test_token";
  process.env.NOTION_FEEDBACK_DATABASE_ID = "database_test_id";
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(new Response(null, { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
  restoreEnvironmentValue("NOTION_TOKEN", originalEnvironment.notionToken);
  restoreEnvironmentValue("NOTION_FEEDBACK_DATABASE_ID", originalEnvironment.databaseId);
});

describe("feedback submission", () => {
  test("creates a Notion page with the submitted fields", async () => {
    const { submitFeedback } = await import("../src/app/feedback/actions");

    const result = await submitFeedback(
      { status: "idle" },
      createFormData({
        category: "Bug",
        message: "The guide link does not open.",
        email: "hello@example.com",
        url: "https://open-agency.io/blog/guide",
      }),
    );

    expect(result).toEqual({ status: "success" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.notion.com/v1/pages",
      expect.objectContaining({
        headers: {
          Authorization: "Bearer secret_test_token",
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
        method: "POST",
      }),
    );

    const request = fetchMock.mock.calls[0]?.[1];
    expect(request?.body).toContain('"database_id":"database_test_id"');
    expect(request?.body).toContain('"name":"Bug"');
    expect(request?.body).toContain('"email":"hello@example.com"');
    expect(request?.body).toContain('"url":"https://open-agency.io/blog/guide"');
    expect(request?.body).toContain('"content":"The guide link does not open."');
  });

  test("returns a configuration error without calling Notion", async () => {
    delete process.env.NOTION_TOKEN;
    const { submitFeedback } = await import("../src/app/feedback/actions");

    const result = await submitFeedback(
      { status: "idle" },
      createFormData({ category: "Other", message: "A note" }),
    );

    expect(result).toEqual({
      status: "error",
      error: "Feedback is not configured yet. Please try again later.",
      code: "configuration",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("rejects invalid feedback before calling Notion", async () => {
    const { submitFeedback } = await import("../src/app/feedback/actions");

    const result = await submitFeedback(
      { status: "idle" },
      createFormData({ category: "Unknown", message: "" }),
    );

    expect(result).toMatchObject({ status: "error", code: "invalid" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("returns a generic error when Notion rejects the request", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }));
    const { submitFeedback } = await import("../src/app/feedback/actions");

    const result = await submitFeedback(
      { status: "idle" },
      createFormData({ category: "Feature request", message: "Add RSS." }),
    );

    expect(result).toEqual({
      status: "error",
      error: "We could not save your feedback. Please try again.",
      code: "generic",
    });
  });
});

test("keeps one feedback trigger outside the Legal links and opens its modal", async () => {
  render(
    <CookieConsentProvider>
      <FeedbackProvider>
        <FeedbackButton />
        <footer>
          <FooterSection content={homepageContent.footer} />
        </footer>
      </FeedbackProvider>
    </CookieConsentProvider>,
  );

  expect(screen.getAllByRole("button", { name: "Share feedback" })).toHaveLength(1);

  const legalHeading = screen.getByRole("heading", { name: "Legal" });
  const legalSection = legalHeading.closest("section");

  if (!legalSection) {
    throw new Error("Expected the Legal footer column to be a section");
  }

  expect(within(legalSection).getByRole("link", { name: "Privacy" }).getAttribute("href")).toBe("/privacy");
  expect(within(legalSection).getByRole("link", { name: "Terms" }).getAttribute("href")).toBe("/terms");
  expect(within(legalSection).queryByRole("button", { name: "Share feedback" })).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: "Share feedback" }));

  expect(await screen.findByRole("dialog", { name: "What should we improve?" })).toBeTruthy();
});
