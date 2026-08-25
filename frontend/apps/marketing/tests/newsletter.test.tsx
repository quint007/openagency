import { createHmac } from "node:crypto";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const { contactsCreateMock, contactsUpdateMock, sendMock } = vi.hoisted(() => ({
  contactsCreateMock: vi.fn(),
  contactsUpdateMock: vi.fn(),
  sendMock: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: vi.fn(function MockResend() {
    return {
      emails: { send: sendMock },
      contacts: {
        create: contactsCreateMock,
        update: contactsUpdateMock,
      },
    };
  }),
}));

const originalEnvironment = {
  apiKey: process.env.RESEND_API_KEY,
  audienceId: process.env.RESEND_AUDIENCE_ID,
  serverUrl: process.env.NEXT_PUBLIC_SERVER_URL,
  tokenSecret: process.env.NEWSLETTER_TOKEN_SECRET,
};

let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

async function loadActionsModule() {
  return import("../src/app/newsletter/actions");
}

async function loadUnsubscribePageModule() {
  return import("../src/app/newsletter/unsubscribe/page");
}

function createFormData(email: string): FormData {
  const formData = new FormData();
  formData.set("email", email);
  return formData;
}

function createToken(email: string, exp: number): string {
  const payload = JSON.stringify({ email, exp });
  const payloadPart = Buffer.from(payload, "utf8").toString("base64url");
  const signaturePart = createHmac("sha256", process.env.NEWSLETTER_TOKEN_SECRET ?? "")
    .update(payload)
    .digest("base64url");

  return `${payloadPart}.${signaturePart}`;
}

function restoreEnvironmentValue(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

beforeEach(() => {
  process.env.RESEND_API_KEY = "test-resend-key";
  process.env.RESEND_AUDIENCE_ID = "audience_123";
  process.env.NEXT_PUBLIC_SERVER_URL = "http://localhost:3000";
  process.env.NEWSLETTER_TOKEN_SECRET = "test-newsletter-secret";
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  contactsCreateMock.mockReset();
  contactsCreateMock.mockResolvedValue({
    data: { id: "contact_123", object: "contact" },
    error: null,
  });
  contactsUpdateMock.mockReset();
  contactsUpdateMock.mockResolvedValue({
    data: { id: "contact_123", object: "contact" },
    error: null,
  });
  sendMock.mockReset();
  sendMock.mockResolvedValue({ id: "email_123", error: null });
});

afterEach(() => {
  vi.resetModules();
  contactsCreateMock.mockReset();
  contactsUpdateMock.mockReset();
  sendMock.mockReset();
  consoleErrorSpy.mockRestore();
  restoreEnvironmentValue("RESEND_API_KEY", originalEnvironment.apiKey);
  restoreEnvironmentValue("RESEND_AUDIENCE_ID", originalEnvironment.audienceId);
  restoreEnvironmentValue("NEXT_PUBLIC_SERVER_URL", originalEnvironment.serverUrl);
  restoreEnvironmentValue("NEWSLETTER_TOKEN_SECRET", originalEnvironment.tokenSecret);
});

describe("newsletter subscribe flow", () => {
  test("persists a subscription and sends a welcome email with an opaque token", async () => {
    const { newsletterSignup } = await loadActionsModule();

    const result = await newsletterSignup({ status: "idle" }, createFormData("hello@example.com"));

    expect(result).toEqual({ status: "success" });
    expect(contactsCreateMock).toHaveBeenCalledWith({
      audienceId: "audience_123",
      email: "hello@example.com",
      unsubscribed: false,
    });
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Open Agency <hello@open-agency.io>",
        subject: "Welcome to the Open Agency newsletter!",
        to: "hello@example.com",
      }),
    );

    const [{ html }] = sendMock.mock.calls[0] ?? [];
    expect(html).toContain("Welcome to Open Agency");
    expect(html).toMatch(/\/newsletter\/unsubscribe\?t=[^"&]+/);
    expect(html).not.toContain("email=");
    expect(html).not.toContain("hello%40example.com");
  });

  test("returns a configuration error when the audience is missing", async () => {
    delete process.env.RESEND_AUDIENCE_ID;
    const { newsletterSignup } = await loadActionsModule();

    const result = await newsletterSignup({ status: "idle" }, createFormData("hello@example.com"));

    expect(result).toEqual({
      status: "error",
      error: "Newsletter configuration is missing.",
      code: "configuration",
    });
    expect(contactsCreateMock).not.toHaveBeenCalled();
    expect(sendMock).not.toHaveBeenCalled();
  });

  test("returns a configuration error when the API key is missing", async () => {
    delete process.env.RESEND_API_KEY;
    const { newsletterSignup } = await loadActionsModule();

    const result = await newsletterSignup({ status: "idle" }, createFormData("hello@example.com"));

    expect(result).toEqual({
      status: "error",
      error: "Newsletter configuration is missing.",
      code: "configuration",
    });
    expect(contactsCreateMock).not.toHaveBeenCalled();
    expect(sendMock).not.toHaveBeenCalled();
  });

  test("returns a generic error when Resend rejects contact persistence", async () => {
    contactsCreateMock.mockResolvedValueOnce({
      data: null,
      error: {
        message: "Resend unavailable",
        name: "internal_server_error",
        statusCode: 500,
      },
    });
    const { newsletterSignup } = await loadActionsModule();

    const result = await newsletterSignup({ status: "idle" }, createFormData("hello@example.com"));

    expect(result).toEqual({
      status: "error",
      error: "Something went wrong. Please try again.",
      code: "generic",
    });
    expect(sendMock).not.toHaveBeenCalled();
  });

  test("returns success when contact persistence succeeds but welcome email delivery fails", async () => {
    sendMock.mockRejectedValueOnce(new Error("Resend unavailable"));
    const { newsletterSignup } = await loadActionsModule();

    const result = await newsletterSignup({ status: "idle" }, createFormData("hello@example.com"));

    expect(result).toEqual({ status: "success" });
    expect(contactsCreateMock).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Newsletter welcome email failed",
      expect.objectContaining({ emailHash: expect.any(String) }),
    );
  });

  test("rejects invalid email without calling Resend", async () => {
    const { newsletterSignup } = await loadActionsModule();

    const result = await newsletterSignup({ status: "idle" }, createFormData("not-an-email"));

    expect(result).toEqual({
      error: "Please enter a valid email address",
      status: "error",
      code: "invalid",
    });
    expect(contactsCreateMock).not.toHaveBeenCalled();
    expect(sendMock).not.toHaveBeenCalled();
  });
});

describe("newsletter unsubscribe tokens", () => {
  test("generates and verifies a signed token with a seven-day lifetime", async () => {
    const { generateUnsubscribeToken, verifyUnsubscribeToken } = await loadActionsModule();
    const now = Math.floor(Date.now() / 1000);

    const token = await generateUnsubscribeToken("hello@example.com");
    const payloadPart = token.split(".")[0];
    const payload = JSON.parse(Buffer.from(payloadPart ?? "", "base64url").toString("utf8"));
    const verified = await verifyUnsubscribeToken(token);

    expect(token.split(".")).toHaveLength(2);
    expect(token).not.toContain("hello@example.com");
    expect(payload.exp).toBeGreaterThanOrEqual(now + 7 * 24 * 60 * 60);
    expect(verified).toMatchObject({ email: "hello@example.com" });
  });

  test("rejects an expired token without mutating Resend", async () => {
    const { unsubscribeNewsletter } = await loadActionsModule();
    const token = createToken("hello@example.com", Math.floor(Date.now() / 1000) - 1);

    const result = await unsubscribeNewsletter(token);

    expect(result).toEqual({
      status: "error",
      error: "This unsubscribe link is invalid or has expired.",
      code: "invalid",
    });
    expect(contactsUpdateMock).not.toHaveBeenCalled();
  });

  test("rejects malformed and tampered tokens with the same safe error", async () => {
    const { unsubscribeNewsletter, generateUnsubscribeToken } = await loadActionsModule();
    const token = await generateUnsubscribeToken("hello@example.com");
    const tamperedToken = `${token.slice(0, -1)}${token.endsWith("a") ? "b" : "a"}`;

    for (const invalidToken of ["not-a-token", tamperedToken]) {
      const result = await unsubscribeNewsletter(invalidToken);

      expect(result).toEqual({
        status: "error",
        error: "This unsubscribe link is invalid or has expired.",
        code: "invalid",
      });
    }

    expect(contactsUpdateMock).not.toHaveBeenCalled();
  });

  test("returns a configuration error when the token secret is missing", async () => {
    const { generateUnsubscribeToken, unsubscribeNewsletter } = await loadActionsModule();
    const token = await generateUnsubscribeToken("hello@example.com");
    delete process.env.NEWSLETTER_TOKEN_SECRET;

    const result = await unsubscribeNewsletter(token);

    expect(result).toEqual({
      status: "error",
      error: "Newsletter configuration is missing.",
      code: "configuration",
    });
    expect(contactsUpdateMock).not.toHaveBeenCalled();
  });
});

describe("newsletter unsubscribe flow", () => {
  test("renders a GET confirmation page without mutating Resend", async () => {
    const { generateUnsubscribeToken } = await loadActionsModule();
    const token = await generateUnsubscribeToken("hello@example.com");
    const { default: UnsubscribePage } = await loadUnsubscribePageModule();

    render(await UnsubscribePage({ searchParams: Promise.resolve({ t: token }) }));

    expect(
      screen.getByRole("heading", {
        name: "Confirm your unsubscribe request.",
      }),
    ).toBeTruthy();
    expect(screen.getByText(/hello@example\.com/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Confirm unsubscribe" })).toBeTruthy();
    expect(screen.getByDisplayValue(token)).toBeTruthy();
    expect(contactsUpdateMock).not.toHaveBeenCalled();
  });

  test("renders an error page for a missing token without mutating Resend", async () => {
    const { default: UnsubscribePage } = await loadUnsubscribePageModule();

    render(await UnsubscribePage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("heading", { name: "We could not verify this link." })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Confirm unsubscribe" })).toBeNull();
    expect(contactsUpdateMock).not.toHaveBeenCalled();
  });

  test("performs the unsubscribe mutation through the form server action", async () => {
    const { generateUnsubscribeToken, unsubscribeNewsletterForm } = await loadActionsModule();
    const token = await generateUnsubscribeToken("hello@example.com");
    const formData = new FormData();
    formData.set("token", token);

    const result = await unsubscribeNewsletterForm({ status: "idle" }, formData);

    expect(result).toEqual({ status: "success" });
    expect(contactsUpdateMock).toHaveBeenCalledWith({
      audienceId: "audience_123",
      email: "hello@example.com",
      unsubscribed: true,
    });
  });

  test("is idempotent when the unsubscribe action is repeated", async () => {
    const { generateUnsubscribeToken, unsubscribeNewsletter } = await loadActionsModule();
    const token = await generateUnsubscribeToken("hello@example.com");

    await expect(unsubscribeNewsletter(token)).resolves.toEqual({
      status: "success",
    });
    await expect(unsubscribeNewsletter(token)).resolves.toEqual({
      status: "success",
    });

    expect(contactsUpdateMock).toHaveBeenCalledTimes(2);
  });

  test("treats a missing Resend contact as already unsubscribed", async () => {
    contactsUpdateMock.mockResolvedValueOnce({
      data: null,
      error: {
        message: "Contact not found",
        name: "not_found",
        statusCode: 404,
      },
    });
    const { generateUnsubscribeToken, unsubscribeNewsletter } = await loadActionsModule();
    const token = await generateUnsubscribeToken("hello@example.com");

    await expect(unsubscribeNewsletter(token)).resolves.toEqual({
      status: "success",
    });
  });

  test("returns a configuration error when unsubscribing without an audience", async () => {
    const { generateUnsubscribeToken, unsubscribeNewsletter } = await loadActionsModule();
    const token = await generateUnsubscribeToken("hello@example.com");
    delete process.env.RESEND_AUDIENCE_ID;

    const result = await unsubscribeNewsletter(token);

    expect(result).toEqual({
      status: "error",
      error: "Newsletter configuration is missing.",
      code: "configuration",
    });
    expect(contactsUpdateMock).not.toHaveBeenCalled();
  });
});
