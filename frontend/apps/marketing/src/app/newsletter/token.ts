import { createHmac, timingSafeEqual } from "node:crypto";

import { z } from "zod";

const tokenPayloadSchema = z
  .object({
    email: z.string().email(),
    exp: z.number().int().positive(),
  })
  .strict();

const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;
export const INVALID_TOKEN_ERROR = "This unsubscribe link is invalid or has expired.";

export type UnsubscribeTokenPayload = z.infer<typeof tokenPayloadSchema>;

export class NewsletterConfigurationError extends Error {
  readonly name = "NewsletterConfigurationError";
}

class InvalidUnsubscribeTokenError extends Error {
  readonly name = "InvalidUnsubscribeTokenError";

  constructor() {
    super(INVALID_TOKEN_ERROR);
  }
}

function getNewsletterTokenSecret(): string {
  const secret = process.env.NEWSLETTER_TOKEN_SECRET?.trim();

  if (!secret) {
    throw new NewsletterConfigurationError("NEWSLETTER_TOKEN_SECRET is missing.");
  }

  return secret;
}

function decodeBase64Url(value: string): Buffer {
  if (!BASE64URL_PATTERN.test(value)) {
    throw new InvalidUnsubscribeTokenError();
  }

  const decoded = Buffer.from(value, "base64url");

  if (decoded.length === 0 || decoded.toString("base64url") !== value) {
    throw new InvalidUnsubscribeTokenError();
  }

  return decoded;
}

export function createUnsubscribeToken(email: string): string {
  const payload = JSON.stringify({
    email,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  });
  const payloadPart = Buffer.from(payload, "utf8").toString("base64url");
  const signaturePart = createHmac("sha256", getNewsletterTokenSecret()).update(payload).digest("base64url");

  return `${payloadPart}.${signaturePart}`;
}

export function readUnsubscribeToken(token: string): UnsubscribeTokenPayload {
  const tokenParts = token.split(".");

  if (tokenParts.length !== 2 || tokenParts.some((part) => part.length === 0)) {
    throw new InvalidUnsubscribeTokenError();
  }

  const payloadPart = tokenParts[0];
  const signaturePart = tokenParts[1];

  if (!payloadPart || !signaturePart) {
    throw new InvalidUnsubscribeTokenError();
  }

  try {
    const payload = decodeBase64Url(payloadPart);
    const signature = decodeBase64Url(signaturePart);
    const expectedSignature = createHmac("sha256", getNewsletterTokenSecret()).update(payload).digest();

    if (signature.length !== expectedSignature.length || !timingSafeEqual(signature, expectedSignature)) {
      throw new InvalidUnsubscribeTokenError();
    }

    const parsedJson: unknown = JSON.parse(payload.toString("utf8"));
    const result = tokenPayloadSchema.safeParse(parsedJson);

    if (!result.success || result.data.exp <= Math.floor(Date.now() / 1000)) {
      throw new InvalidUnsubscribeTokenError();
    }

    return result.data;
  } catch (error) {
    if (error instanceof NewsletterConfigurationError) {
      throw error;
    }

    if (error instanceof InvalidUnsubscribeTokenError) {
      throw error;
    }

    throw new InvalidUnsubscribeTokenError();
  }
}
