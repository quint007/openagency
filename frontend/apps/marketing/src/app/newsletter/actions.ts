"use server";

import { z } from "zod";
import { headers } from "next/headers";

import {
  callNewsletterService,
  NewsletterServiceConfigurationError,
  NewsletterServiceRequestError,
} from "./service-client";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const INVALID_CONFIRMATION_ERROR = "This confirmation link is invalid or has expired.";
const INVALID_UNSUBSCRIBE_ERROR = "This unsubscribe link is invalid.";
const NEWSLETTER_CONFIGURATION_ERROR = "Newsletter configuration is missing.";
const GENERIC_NEWSLETTER_ERROR = "Something went wrong. Please try again.";

const newsletterEnabled = (): boolean =>
  process.env.NEXT_PUBLIC_NEWSLETTER_ENABLED === "true" || process.env.NODE_ENV !== "production";

async function getRequesterIdentity(): Promise<string> {
  try {
    const requestHeaders = await headers();
    const forwarded =
      requestHeaders.get("x-vercel-forwarded-for") ??
      requestHeaders.get("cf-connecting-ip") ??
      requestHeaders.get("x-forwarded-for") ??
      requestHeaders.get("x-real-ip");
    return forwarded?.split(",", 1)[0]?.trim().slice(0, 200) || "unknown";
  } catch {
    return "unknown";
  }
}

export type NewsletterErrorCode = "required" | "invalid" | "configuration" | "generic";

export type NewsletterSignupResult =
  | { readonly status: "idle" }
  | { readonly status: "success" }
  | {
      readonly status: "error";
      readonly error: string;
      readonly code: NewsletterErrorCode;
    };

function errorResult(error: unknown, invalidMessage?: string): NewsletterSignupResult {
  if (error instanceof NewsletterServiceConfigurationError) {
    return { status: "error", error: NEWSLETTER_CONFIGURATION_ERROR, code: "configuration" };
  }
  if (error instanceof NewsletterServiceRequestError && error.status === 400 && invalidMessage) {
    return { status: "error", error: invalidMessage, code: "invalid" };
  }

  console.error("Newsletter service request failed", {
    errorType: error instanceof Error ? error.name : "unknown",
  });
  return { status: "error", error: GENERIC_NEWSLETTER_ERROR, code: "generic" };
}

export async function inspectNewsletterToken(
  type: "confirmation" | "unsubscribe",
  token: string,
): Promise<boolean> {
  if (type === "confirmation" && !newsletterEnabled()) return false;
  try {
    const result = await callNewsletterService<{ valid: boolean }>("inspect", { token, type });
    return result.valid;
  } catch (error) {
    if (error instanceof NewsletterServiceConfigurationError) throw error;
    return false;
  }
}

export async function confirmNewsletter(token: string): Promise<NewsletterSignupResult> {
  if (!newsletterEnabled()) {
    return { status: "error", error: NEWSLETTER_CONFIGURATION_ERROR, code: "configuration" };
  }
  try {
    await callNewsletterService("confirm", { token });
    return { status: "success" };
  } catch (error) {
    return errorResult(error, INVALID_CONFIRMATION_ERROR);
  }
}

export async function confirmNewsletterForm(
  _previousState: NewsletterSignupResult,
  formData: FormData,
): Promise<NewsletterSignupResult> {
  const token = formData.get("token");
  if (typeof token !== "string" || token.length === 0) {
    return { status: "error", error: INVALID_CONFIRMATION_ERROR, code: "invalid" };
  }
  return confirmNewsletter(token);
}

export async function unsubscribeNewsletter(token: string): Promise<NewsletterSignupResult> {
  try {
    await callNewsletterService("unsubscribe", { token });
    return { status: "success" };
  } catch (error) {
    return errorResult(error, INVALID_UNSUBSCRIBE_ERROR);
  }
}

export async function unsubscribeNewsletterForm(
  _previousState: NewsletterSignupResult,
  formData: FormData,
): Promise<NewsletterSignupResult> {
  const token = formData.get("token");
  if (typeof token !== "string" || token.length === 0) {
    return { status: "error", error: INVALID_UNSUBSCRIBE_ERROR, code: "invalid" };
  }
  return unsubscribeNewsletter(token);
}

export async function newsletterSignup(
  _previousState: NewsletterSignupResult,
  formData: FormData,
): Promise<NewsletterSignupResult> {
  if (!newsletterEnabled()) {
    return { status: "error", error: NEWSLETTER_CONFIGURATION_ERROR, code: "configuration" };
  }
  const email = formData.get("email");
  const result = emailSchema.safeParse({ email });
  if (!result.success) {
    return {
      status: "error",
      error: result.error.issues[0]?.message ?? "Invalid email",
      code: email === null || email === "" ? "required" : "invalid",
    };
  }

  if (process.env.NODE_ENV !== "production" && process.env.E2E_NEWSLETTER_SUCCESS === "true") {
    return { status: "success" };
  }

  try {
    await callNewsletterService("request", {
      email: result.data.email,
      requester: await getRequesterIdentity(),
    });
    return { status: "success" };
  } catch (error) {
    return errorResult(error);
  }
}
