import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { CookieConsentProvider } from "../src/app/components/CookieConsent";
import { FeedbackButton, FeedbackProvider } from "../src/app/components/Feedback";
import { FooterSection } from "../src/app/components/homepage/FooterSection";
import { homepageContent } from "../src/app/homepage-content";

const fetchMock = vi.hoisted(() =>
  vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(),
);

const sendMock = vi.hoisted(() => vi.fn());

const originalEnvironment = {
  notionToken: process.env.NOTION_TOKEN,
  databaseId: process.env.NOTION_FEEDBACK_DATABASE_ID,
  resendApiKey: process.env.RESEND_API_KEY,
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
  process.env.RESEND_API_KEY = "resend_test_key";
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(new Response(null, { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  sendMock.mockReset();
  sendMock.mockResolvedValue({ data: { id: "message-id" }, error: null });
});

afterEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
  restoreEnvironmentValue("NOTION_TOKEN", originalEnvironment.notionToken);
  restoreEnvironmentValue("NOTION_FEEDBACK_DATABASE_ID", originalEnvironment.databaseId);
  restoreEnvironmentValue("RESEND_API_KEY", originalEnvironment.resendApiKey);
});

vi.mock("resend", () => ({
  Resend: function MockResend() {
    return {
      emails: {
        send: sendMock,
      },
    };
  },
}));

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
    expect(sendMock).not.toHaveBeenCalled();

    const request = fetchMock.mock.calls[0]?.[1];
    expect(request?.body).toContain('"database_id":"database_test_id"');
    expect(request?.body).toContain('"name":"Bug"');
    expect(request?.body).toContain('"email":"hello@example.com"');
    expect(request?.body).toContain('"url":"https://open-agency.io/blog/guide"');
    expect(request?.body).toContain('"content":"The guide link does not open."');
  });

  test("falls back to email when Notion is not configured", async () => {
    delete process.env.NOTION_TOKEN;
    const { submitFeedback } = await import("../src/app/feedback/actions");

    const result = await submitFeedback(
      { status: "idle" },
      createFormData({ category: "Other", message: "A note" }),
    );

    expect(result).toEqual({ status: "success" });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Open Agency Feedback <hello@open-agency.io>",
        subject: "Feedback — Other",
        text: "Category: Other\nPage: Not provided\nFrom: Not provided\n\nA note",
        to: "hello@open-agency.io",
      }),
    );
  });

  test("falls back to email when Notion rejects the request", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }));
    const { submitFeedback } = await import("../src/app/feedback/actions");

    const result = await submitFeedback(
      { status: "idle" },
      createFormData({ category: "Feature request", message: "Add RSS." }),
    );

    expect(result).toEqual({ status: "success" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  test("rejects empty message before calling Notion or email", async () => {
    const { submitFeedback } = await import("../src/app/feedback/actions");

    const result = await submitFeedback(
      { status: "idle" },
      createFormData({ category: "Other", message: "" }),
    );

    expect(result).toMatchObject({
      status: "error",
      code: "invalid",
      error: "Tell us what you noticed.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(sendMock).not.toHaveBeenCalled();
  });

  test("rejects an unknown category before calling Notion or email", async () => {
    const { submitFeedback } = await import("../src/app/feedback/actions");

    const result = await submitFeedback(
      { status: "idle" },
      createFormData({ category: "Unknown", message: "A note" }),
    );

    expect(result).toMatchObject({ status: "error", code: "invalid" });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(sendMock).not.toHaveBeenCalled();
  });

  test("returns a configuration error when neither Notion nor Resend is configured", async () => {
    delete process.env.NOTION_TOKEN;
    delete process.env.RESEND_API_KEY;
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
    expect(sendMock).not.toHaveBeenCalled();
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
