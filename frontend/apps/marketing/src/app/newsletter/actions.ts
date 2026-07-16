"use server";

import { render } from "@react-email/render";
import { Resend } from "resend";
import { z } from "zod";
import { WelcomeEmail } from "./emails/WelcomeEmail";
import {
  assertResendSuccess,
  getEmailHash,
  isNotFoundError,
  NewsletterServiceError,
  subscribeContact,
} from "./resend";
import {
  createUnsubscribeToken,
  INVALID_TOKEN_ERROR,
  NewsletterConfigurationError,
  readUnsubscribeToken,
  type UnsubscribeTokenPayload,
} from "./token";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const NEWSLETTER_CONFIGURATION_ERROR = "Newsletter configuration is missing.";
const GENERIC_NEWSLETTER_ERROR = "Something went wrong. Please try again.";

export type NewsletterErrorCode = "required" | "invalid" | "configuration" | "generic";

export type NewsletterSignupResult =
  | { readonly status: "idle" }
  | { readonly status: "success" }
  | {
      readonly status: "error";
      readonly error: string;
      readonly code: NewsletterErrorCode;
    };

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    throw new NewsletterConfigurationError("RESEND_API_KEY is missing.");
  }

  return new Resend(apiKey);
}

function getNewsletterAudienceId(): string | null {
  return process.env.RESEND_AUDIENCE_ID?.trim() || null;
}

export async function generateUnsubscribeToken(email: string): Promise<string> {
  const result = emailSchema.safeParse({ email });

  if (!result.success) {
    throw new NewsletterServiceError("newsletter token", null, "invalid_email");
  }

  return createUnsubscribeToken(result.data.email);
}

export async function verifyUnsubscribeToken(token: string): Promise<UnsubscribeTokenPayload | null> {
  try {
    return readUnsubscribeToken(token);
  } catch (error) {
    if (error instanceof NewsletterConfigurationError) {
      throw error;
    }

    return null;
  }
}

export async function unsubscribeNewsletter(token: string): Promise<NewsletterSignupResult> {
  const audienceId = getNewsletterAudienceId();

  if (!audienceId) {
    return {
      status: "error",
      error: NEWSLETTER_CONFIGURATION_ERROR,
      code: "configuration",
    };
  }

  let payload: UnsubscribeTokenPayload | null;

  try {
    payload = await verifyUnsubscribeToken(token);
  } catch (error) {
    if (error instanceof NewsletterConfigurationError) {
      return {
        status: "error",
        error: NEWSLETTER_CONFIGURATION_ERROR,
        code: "configuration",
      };
    }

    throw error;
  }

  if (!payload) {
    return { status: "error", error: INVALID_TOKEN_ERROR, code: "invalid" };
  }

  let resend: Resend;

  try {
    resend = getResendClient();
  } catch (error) {
    if (error instanceof NewsletterConfigurationError) {
      return {
        status: "error",
        error: NEWSLETTER_CONFIGURATION_ERROR,
        code: "configuration",
      };
    }

    throw error;
  }

  try {
    const response = await resend.contacts.update({
      audienceId,
      email: payload.email,
      unsubscribed: true,
    });

    if (!response.error || response.error.statusCode === 404 || response.error.name === "not_found") {
      return { status: "success" };
    }

    assertResendSuccess(response, "newsletter unsubscribe");
    return { status: "success" };
  } catch (error) {
    if (isNotFoundError(error)) {
      return { status: "success" };
    }

    if (error instanceof Error) {
      console.error("Newsletter unsubscribe failed", {
        emailHash: getEmailHash(payload.email),
        errorType: error.name,
      });
      return {
        status: "error",
        error: GENERIC_NEWSLETTER_ERROR,
        code: "generic",
      };
    }

    throw error;
  }
}

export async function unsubscribeNewsletterForm(
  _previousState: NewsletterSignupResult,
  formData: FormData,
): Promise<NewsletterSignupResult> {
  const token = formData.get("token");

  if (typeof token !== "string" || token.length === 0) {
    return { status: "error", error: INVALID_TOKEN_ERROR, code: "invalid" };
  }

  return unsubscribeNewsletter(token);
}

export async function newsletterSignup(
  _previousState: NewsletterSignupResult,
  formData: FormData,
): Promise<NewsletterSignupResult> {
  const email = formData.get("email");

  const result = emailSchema.safeParse({ email });
  if (!result.success) {
    const error = result.error.issues[0]?.message ?? "Invalid email";
    const code = email === null || email === "" ? "required" : "invalid";
    return { status: "error", error, code };
  }

  const validEmail = result.data.email;
  const audienceId = getNewsletterAudienceId();

  if (!audienceId) {
    return {
      status: "error",
      error: NEWSLETTER_CONFIGURATION_ERROR,
      code: "configuration",
    };
  }

  let resend: Resend;

  try {
    resend = getResendClient();
  } catch (error) {
    if (error instanceof NewsletterConfigurationError) {
      return {
        status: "error",
        error: NEWSLETTER_CONFIGURATION_ERROR,
        code: "configuration",
      };
    }

    throw error;
  }

  let unsubscribeToken: string;

  try {
    unsubscribeToken = await generateUnsubscribeToken(validEmail);
  } catch (error) {
    if (error instanceof NewsletterConfigurationError) {
      return {
        status: "error",
        error: NEWSLETTER_CONFIGURATION_ERROR,
        code: "configuration",
      };
    }

    throw error;
  }
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL?.trim() || "https://open-agency.io";
  const unsubscribeUrl = new URL("/newsletter/unsubscribe", baseUrl);
  unsubscribeUrl.searchParams.set("t", unsubscribeToken);

  try {
    await subscribeContact(resend, audienceId, validEmail);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Newsletter contact persistence failed", {
        emailHash: getEmailHash(validEmail),
        errorType: error.name,
      });
      return {
        status: "error",
        error: GENERIC_NEWSLETTER_ERROR,
        code: "generic",
      };
    }

    throw error;
  }

  try {
    const html = await render(WelcomeEmail({ unsubscribeUrl: unsubscribeUrl.toString() }));

    const response = await resend.emails.send({
      from: "Open Agency <hello@open-agency.io>",
      to: validEmail,
      subject: "Welcome to the Open Agency newsletter!",
      html,
    });

    assertResendSuccess(response, "newsletter welcome email");
  } catch (error) {
    if (error instanceof Error) {
      console.error("Newsletter welcome email failed", {
        emailHash: getEmailHash(validEmail),
        errorType: error.name,
      });
    } else {
      throw error;
    }
  }

  return { status: "success" };
}
