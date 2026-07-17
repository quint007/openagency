"use server";

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

function getFeedbackInput(formData: FormData) {
  return {
    category: getOptionalString(formData, "category"),
    message: getOptionalString(formData, "message"),
    email: getOptionalString(formData, "email"),
    url: getOptionalString(formData, "url"),
  };
}

function getErrorType(error: unknown): string {
  return error instanceof Error ? error.name : "UnknownError";
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

  const token = process.env.NOTION_TOKEN?.trim();
  const databaseId = process.env.NOTION_FEEDBACK_DATABASE_ID?.trim();

  if (!token || !databaseId) {
    return {
      status: "error",
      error: CONFIGURATION_ERROR,
      code: "configuration",
    };
  }

  const { category, email, message, url } = parsedInput.data;
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
