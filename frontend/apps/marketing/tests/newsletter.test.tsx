import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const { headersMock } = vi.hoisted(() => ({ headersMock: vi.fn() }));

vi.mock("next/headers", () => ({ headers: headersMock }));

const originalEnvironment = {
  apiUrl: process.env.PAYLOAD_API_URL,
  serviceSecret: process.env.NEWSLETTER_SERVICE_SECRET,
};

const fetchMock = vi.fn<typeof fetch>();
let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status,
  });
}

function emailForm(email: string): FormData {
  const formData = new FormData();
  formData.set("email", email);
  return formData;
}

function tokenForm(token: string): FormData {
  const formData = new FormData();
  formData.set("token", token);
  return formData;
}

beforeEach(() => {
  process.env.PAYLOAD_API_URL = "http://localhost:3002";
  process.env.NEWSLETTER_SERVICE_SECRET = "newsletter-service-test-secret";
  headersMock.mockReset();
  headersMock.mockResolvedValue(new Headers({ "x-vercel-forwarded-for": "203.0.113.8" }));
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  consoleErrorSpy.mockRestore();
  vi.resetModules();

  if (originalEnvironment.apiUrl === undefined) delete process.env.PAYLOAD_API_URL;
  else process.env.PAYLOAD_API_URL = originalEnvironment.apiUrl;
  if (originalEnvironment.serviceSecret === undefined) delete process.env.NEWSLETTER_SERVICE_SECRET;
  else process.env.NEWSLETTER_SERVICE_SECRET = originalEnvironment.serviceSecret;
});

describe("newsletter signup", () => {
  test("returns the same neutral success after requesting inbox confirmation", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: "accepted" }));
    const { newsletterSignup } = await import("../src/app/newsletter/actions");

    await expect(newsletterSignup({ status: "idle" }, emailForm("Hello@Example.com"))).resolves.toEqual({
      status: "success",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      new URL("http://localhost:3002/api/newsletter/request"),
      expect.objectContaining({
        body: JSON.stringify({ email: "Hello@Example.com", requester: "203.0.113.8" }),
        headers: expect.objectContaining({
          "x-newsletter-service-secret": "newsletter-service-test-secret",
        }),
        method: "POST",
      }),
    );
  });

  test("rejects invalid email without calling the backend", async () => {
    const { newsletterSignup } = await import("../src/app/newsletter/actions");

    await expect(newsletterSignup({ status: "idle" }, emailForm("not-an-email"))).resolves.toEqual({
      code: "invalid",
      error: "Please enter a valid email address",
      status: "error",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("fails closed when the service credential is missing", async () => {
    delete process.env.NEWSLETTER_SERVICE_SECRET;
    const { newsletterSignup } = await import("../src/app/newsletter/actions");

    await expect(newsletterSignup({ status: "idle" }, emailForm("hello@example.com"))).resolves.toEqual({
      code: "configuration",
      error: "Newsletter configuration is missing.",
      status: "error",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("newsletter confirmation", () => {
  test("GET only inspects the opaque token and requires an explicit confirmation POST", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ valid: true }));
    const { default: ConfirmPage } = await import("../src/app/newsletter/confirm/page");

    render(await ConfirmPage({ searchParams: Promise.resolve({ t: "opaque-confirmation-token" }) }));

    expect(screen.getByRole("heading", { name: "Confirm your subscription." })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Confirm subscription" })).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toEqual(new URL("http://localhost:3002/api/newsletter/inspect"));
  });

  test("activates only through the confirmation action", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: "confirmed" }));
    const { confirmNewsletterForm } = await import("../src/app/newsletter/actions");

    await expect(confirmNewsletterForm({ status: "idle" }, tokenForm("opaque-confirmation-token"))).resolves.toEqual({
      status: "success",
    });
    expect(fetchMock.mock.calls[0]?.[0]).toEqual(new URL("http://localhost:3002/api/newsletter/confirm"));
  });

  test("maps an invalid or expired confirmation to one safe error", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "invalid" }, 400));
    const { confirmNewsletter } = await import("../src/app/newsletter/actions");

    await expect(confirmNewsletter("expired-token")).resolves.toEqual({
      code: "invalid",
      error: "This confirmation link is invalid or has expired.",
      status: "error",
    });
  });
});

describe("newsletter feature flag fail-closed in production", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("signup returns a configuration error without calling the backend when NEXT_PUBLIC_NEWSLETTER_ENABLED is absent", async () => {
    vi.stubEnv("NEXT_PUBLIC_NEWSLETTER_ENABLED", undefined);
    const { newsletterSignup } = await import("../src/app/newsletter/actions");

    await expect(newsletterSignup({ status: "idle" }, emailForm("hello@example.com"))).resolves.toEqual({
      code: "configuration",
      error: "Newsletter configuration is missing.",
      status: "error",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("signup returns a configuration error without calling the backend when NEXT_PUBLIC_NEWSLETTER_ENABLED is false", async () => {
    vi.stubEnv("NEXT_PUBLIC_NEWSLETTER_ENABLED", "false");
    const { newsletterSignup } = await import("../src/app/newsletter/actions");

    await expect(newsletterSignup({ status: "idle" }, emailForm("hello@example.com"))).resolves.toEqual({
      code: "configuration",
      error: "Newsletter configuration is missing.",
      status: "error",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("confirmation returns a configuration error without calling the backend when NEXT_PUBLIC_NEWSLETTER_ENABLED is absent", async () => {
    vi.stubEnv("NEXT_PUBLIC_NEWSLETTER_ENABLED", undefined);
    const { confirmNewsletterForm } = await import("../src/app/newsletter/actions");

    await expect(
      confirmNewsletterForm({ status: "idle" }, tokenForm("opaque-confirmation-token")),
    ).resolves.toEqual({
      code: "configuration",
      error: "Newsletter configuration is missing.",
      status: "error",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("confirmation returns a configuration error without calling the backend when NEXT_PUBLIC_NEWSLETTER_ENABLED is false", async () => {
    vi.stubEnv("NEXT_PUBLIC_NEWSLETTER_ENABLED", "false");
    const { confirmNewsletterForm } = await import("../src/app/newsletter/actions");

    await expect(
      confirmNewsletterForm({ status: "idle" }, tokenForm("opaque-confirmation-token")),
    ).resolves.toEqual({
      code: "configuration",
      error: "Newsletter configuration is missing.",
      status: "error",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("newsletter withdrawal", () => {
  test("browser GET inspects without exposing an email or mutating state", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ valid: true }));
    const { default: UnsubscribePage } = await import("../src/app/newsletter/unsubscribe/page");

    render(await UnsubscribePage({ searchParams: Promise.resolve({ t: "opaque-unsubscribe-token" }) }));

    expect(screen.getByRole("heading", { name: "Confirm your unsubscribe request." })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Confirm unsubscribe" })).toBeTruthy();
    expect(screen.queryByText(/@example\.com/)).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toEqual(new URL("http://localhost:3002/api/newsletter/inspect"));
  });

  test("browser withdrawal mutates through an explicit POST action", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: "unsubscribed" }));
    const { unsubscribeNewsletterForm } = await import("../src/app/newsletter/actions");

    await expect(unsubscribeNewsletterForm({ status: "idle" }, tokenForm("opaque-unsubscribe-token"))).resolves.toEqual({
      status: "success",
    });
    expect(fetchMock.mock.calls[0]?.[0]).toEqual(new URL("http://localhost:3002/api/newsletter/unsubscribe"));
  });

  test("RFC 8058 POST is idempotent for invalid credentials", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "invalid" }, 400));
    const { POST } = await import("../src/app/api/newsletter/unsubscribe/route");
    const response = await POST(
      new Request("http://localhost:3000/api/newsletter/unsubscribe?t=opaque-token", {
        body: "List-Unsubscribe=One-Click",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(204);
  });

  test("RFC 8058 POST returns 503 when first-party withdrawal cannot be recorded", async () => {
    fetchMock.mockRejectedValueOnce(new Error("backend unavailable"));
    const { POST } = await import("../src/app/api/newsletter/unsubscribe/route");
    const response = await POST(
      new Request("http://localhost:3000/api/newsletter/unsubscribe?t=opaque-token", {
        body: "List-Unsubscribe=One-Click",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(503);
  });

  test("RFC 8058 POST rejects non-standard request bodies", async () => {
    const { POST } = await import("../src/app/api/newsletter/unsubscribe/route");
    const response = await POST(
      new Request("http://localhost:3000/api/newsletter/unsubscribe?t=opaque-token", {
        body: "List-Unsubscribe=No",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("RFC 8058 POST returns 503 when the backend unsubscribes but provider sync fails", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: "unsubscribed", providerSynced: false }));
    const { POST } = await import("../src/app/api/newsletter/unsubscribe/route");
    const response = await POST(
      new Request("http://localhost:3000/api/newsletter/unsubscribe?t=opaque-token", {
        body: "List-Unsubscribe=One-Click",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(503);
  });

  test("RFC 8058 POST returns 204 when the backend unsubscribes and provider sync succeeds", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: "unsubscribed", providerSynced: true }));
    const { POST } = await import("../src/app/api/newsletter/unsubscribe/route");
    const response = await POST(
      new Request("http://localhost:3000/api/newsletter/unsubscribe?t=opaque-token", {
        body: "List-Unsubscribe=One-Click",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(204);
  });
});
