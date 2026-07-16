import { createHash } from "node:crypto";

import type { Resend } from "resend";

type ResendErrorShape = {
  readonly name: string;
  readonly statusCode: number | null;
};

export type ResendResponseShape = {
  readonly error: ResendErrorShape | null;
};

export class NewsletterServiceError extends Error {
  readonly name = "NewsletterServiceError";

  constructor(
    readonly operation: string,
    readonly statusCode: number | null,
    readonly errorName: string,
  ) {
    super(`${operation} failed`);
  }
}

export function getEmailHash(email: string): string {
  return createHash("sha256").update(email).digest("hex").slice(0, 12);
}

export function isNotFoundError(error: unknown): boolean {
  if (error instanceof Error && error.name === "not_found") {
    return true;
  }

  if (typeof error !== "object" || error === null || !("statusCode" in error)) {
    return false;
  }

  return error.statusCode === 404;
}

export function assertResendSuccess(response: ResendResponseShape, operation: string): void {
  if (response.error) {
    throw new NewsletterServiceError(operation, response.error.statusCode, response.error.name);
  }
}

export async function subscribeContact(resend: Resend, audienceId: string, email: string): Promise<void> {
  const response = await resend.contacts.create({
    audienceId,
    email,
    unsubscribed: false,
  });

  if (!response.error) {
    return;
  }

  if (response.error.statusCode === 409) {
    const updateResponse = await resend.contacts.update({
      audienceId,
      email,
      unsubscribed: false,
    });

    assertResendSuccess(updateResponse, "newsletter contact update");
    return;
  }

  assertResendSuccess(response, "newsletter contact create");
}
