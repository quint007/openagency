// @vitest-environment node

import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { submitContact } from "../src/app/contact/actions";

const { sendMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: function MockResend() {
    return {
      emails: {
        send: sendMock,
      },
    };
  },
}));

beforeEach(() => {
  vi.stubEnv("RESEND_API_KEY", "test-api-key");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

function createFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData();

  formData.set("email", overrides.email ?? "visitor@example.com");
  formData.set("message", overrides.message ?? "Hello, I have a question.");
  if (overrides.name) {
    formData.set("name", overrides.name);
  }

  return formData;
}

test("submitContact sends an email with the provided details", async () => {
  sendMock.mockResolvedValue({ data: { id: "message-id" }, error: null });

  const result = await submitContact({ status: "idle" }, createFormData({ name: "Alex" }));

  expect(result).toEqual({ status: "success" });
  expect(sendMock).toHaveBeenCalledTimes(1);
  expect(sendMock).toHaveBeenCalledWith(
    expect.objectContaining({
      from: "Alex via Open Agency <hello@open-agency.io>",
      replyTo: "visitor@example.com",
      subject: "Contact form message from Alex",
      text: "From: Alex <visitor@example.com>\n\nHello, I have a question.",
      to: "hello@open-agency.io",
    }),
  );
});

test("submitContact returns an invalid error for missing email", async () => {
  const result = await submitContact({ status: "idle" }, createFormData({ email: "" }));

  expect(result.status).toBe("error");
  expect(result).toMatchObject({ code: "invalid" });
  expect(sendMock).not.toHaveBeenCalled();
});

test("submitContact returns an invalid error for missing message", async () => {
  const result = await submitContact({ status: "idle" }, createFormData({ message: "" }));

  expect(result.status).toBe("error");
  expect(result).toMatchObject({ code: "invalid" });
  expect(sendMock).not.toHaveBeenCalled();
});

test("submitContact returns a configuration error when Resend is not configured", async () => {
  vi.unstubAllEnvs();

  const result = await submitContact({ status: "idle" }, createFormData());

  expect(result).toEqual({
    status: "error",
    error: "Contact form is not configured yet. Please email hello@open-agency.io directly.",
    code: "configuration",
  });
  expect(sendMock).not.toHaveBeenCalled();
});

test("submitContact returns a generic error when Resend reports a failure", async () => {
  sendMock.mockResolvedValue({
    data: null,
    error: { name: "invalid_to", statusCode: 400 },
  });

  const result = await submitContact({ status: "idle" }, createFormData());

  expect(result.status).toBe("error");
  expect(result).toMatchObject({ code: "generic" });
});
