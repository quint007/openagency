"use server";

import { Resend } from "resend";
import { z } from "zod";

import { FEEDBACK_CATEGORIES } from "./constants";

const feedbackSchema = z.object({
  category: z.enum(FEEDBACK_CATEGORIES),
  message: z.string().trim().min(1, "Tell us what you noticed.").max(4000, "Keep your feedback under 4,000 characters."),
  email: z.string().trim().email("Enter a valid email address.").max(254).optional(),
  url: z.string().trim().url("The page URL is invalid.").max(2048).optional(),
});

const CONFIGURATION_ERROR = "Feedback is not configured yet. Please try again later.";
const GENERIC_ERROR = "We could not save your feedback. Please try again.";
const INVALID_ERROR = "Check your feedback and try again.";

export type FeedbackErrorCode = "configuration" | "invalid" | "generic";

export type FeedbackResult =
  | { readonly status: "success" }
  | {
      readonly status: "error";
      readonly error: string;
      readonly code: FeedbackErrorCode;
    };

export type FeedbackActionState = FeedbackResult | { readonly status: "idle" };

function getOptionalString(formData: FormData, name: string): string | undefined {
  const value = formData.get(name);

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

function getRequiredString(formData: FormData, name: string): string {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

function getFeedbackInput(formData: FormData) {
  return {
    category: getRequiredString(formData, "category"),
    message: getRequiredString(formData, "message"),
    email: getOptionalString(formData, "email"),
    url: getOptionalString(formData, "url"),
  };
}

function getErrorType(error: unknown): string {
  return error instanceof Error ? error.name : "UnknownError";
}

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  return apiKey ? new Resend(apiKey) : null;
}

async function sendFeedbackEmail(
  category: string,
  message: string,
  email: string | undefined,
  url: string | undefined,
): Promise<FeedbackResult> {
  const resend = getResendClient();

  if (!resend) {
    return {
      status: "error",
      error: CONFIGURATION_ERROR,
      code: "configuration",
    };
  }

  const lines = [
    `Category: ${category}`,
    `Page: ${url ?? "Not provided"}`,
    `From: ${email ?? "Not provided"}`,
    "",
    message,
  ];

  try {
    const response = await resend.emails.send({
      from: "Open Agency Feedback <hello@open-agency.io>",
      replyTo: email,
      subject: `Feedback — ${category}`,
      text: lines.join("\n"),
      to: "hello@open-agency.io",
    });

    if (response.error) {
      console.error("Feedback email failed", {
        errorType: response.error.name,
        statusCode: response.error.statusCode,
      });
      return { status: "error", error: GENERIC_ERROR, code: "generic" };
    }

    return { status: "success" };
  } catch (error) {
    console.error("Feedback email failed", {
      errorType: getErrorType(error),
    });
    return { status: "error", error: GENERIC_ERROR, code: "generic" };
  }
}

async function persistFeedbackToNotion(
  category: string,
  message: string,
  email: string | undefined,
  url: string | undefined,
): Promise<FeedbackResult> {
  const token = process.env.NOTION_TOKEN?.trim();
  const databaseId = process.env.NOTION_FEEDBACK_DATABASE_ID?.trim();

  if (!token || !databaseId) {
    return { status: "error", error: CONFIGURATION_ERROR, code: "configuration" };
  }

  const page = {
    parent: { database_id: databaseId },
    properties: {
      Name: {
        title: [{ text: { content: `Feedback — ${category}` } }],
      },
      Category: {
        select: { name: category },
      },
      Email: {
        email: email ?? null,
      },
      Message: {
        rich_text: [{ text: { content: message } }],
      },
      URL: {
        url: url ?? null,
      },
      Created: {
        date: { start: new Date().toISOString() },
      },
    },
  };

  try {
    const response = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify(page),
    });

    if (!response.ok) {
      console.error("Feedback persistence failed", {
        errorType: "NotionResponseError",
        status: response.status,
      });
      return { status: "error", error: GENERIC_ERROR, code: "generic" };
    }

    return { status: "success" };
  } catch (error) {
    console.error("Feedback persistence failed", {
      errorType: getErrorType(error),
    });
    return { status: "error", error: GENERIC_ERROR, code: "generic" };
  }
}

export async function submitFeedback(
  _previousState: FeedbackActionState,
  formData: FormData,
): Promise<FeedbackResult> {
  const parsedInput = feedbackSchema.safeParse(getFeedbackInput(formData));

  if (!parsedInput.success) {
    return {
      status: "error",
      error: parsedInput.error.issues[0]?.message ?? INVALID_ERROR,
      code: "invalid",
    };
  }

  const { category, email, message, url } = parsedInput.data;
  const notionResult = await persistFeedbackToNotion(category, message, email, url);

  if (notionResult.status === "success") {
    return notionResult;
  }

  return sendFeedbackEmail(category, message, email, url);
}
