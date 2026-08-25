"use server";

import { Resend } from "resend";
import { z } from "zod";

const contactSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").max(254),
  message: z.string().trim().min(1, "Enter a message.").max(4000, "Keep your message under 4,000 characters."),
  name: z.string().trim().max(100, "Keep your name under 100 characters.").optional(),
});

const CONFIGURATION_ERROR = "Contact form is not configured yet. Please email hello@open-agency.io directly.";
const GENERIC_ERROR = "We could not send your message. Please try again.";

export type ContactErrorCode = "configuration" | "invalid" | "generic";

export type ContactResult =
  | { readonly status: "success" }
  | {
      readonly status: "error";
      readonly error: string;
      readonly code: ContactErrorCode;
    };

export type ContactActionState = ContactResult | { readonly status: "idle" };

function getOptionalString(formData: FormData, name: string): string | undefined {
  const value = formData.get(name);

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

function getContactInput(formData: FormData) {
  return {
    email: getOptionalString(formData, "email"),
    message: getOptionalString(formData, "message"),
    name: getOptionalString(formData, "name"),
  };
}

export async function submitContact(
  _previousState: ContactActionState,
  formData: FormData,
): Promise<ContactResult> {
  const parsedInput = contactSchema.safeParse(getContactInput(formData));

  if (!parsedInput.success) {
    return {
      status: "error",
      error: parsedInput.error.issues[0]?.message ?? "Check your message and try again.",
      code: "invalid",
    };
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    return {
      status: "error",
      error: CONFIGURATION_ERROR,
      code: "configuration",
    };
  }

  const resend = new Resend(apiKey);
  const { email, message, name } = parsedInput.data;
  const senderName = name ? `${name} via Open Agency` : "Open Agency contact form";
  const subject = name ? `Contact form message from ${name}` : "Contact form message";

  try {
    const response = await resend.emails.send({
      from: `${senderName} <hello@open-agency.io>`,
      replyTo: email,
      subject,
      text: `From: ${name ?? "Not provided"} <${email}>\n\n${message}`,
      to: "hello@open-agency.io",
    });

    if (response.error) {
      console.error("Contact email failed", {
        errorType: response.error.name,
        statusCode: response.error.statusCode,
      });
      return { status: "error", error: GENERIC_ERROR, code: "generic" };
    }

    return { status: "success" };
  } catch (error) {
    console.error("Contact email failed", {
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return { status: "error", error: GENERIC_ERROR, code: "generic" };
  }
}
