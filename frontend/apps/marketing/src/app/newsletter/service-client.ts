import "server-only";

type NewsletterOperation = "confirm" | "inspect" | "request" | "unsubscribe";

export class NewsletterServiceConfigurationError extends Error {}

export class NewsletterServiceRequestError extends Error {
  constructor(readonly status: number) {
    super(`Newsletter service request failed with status ${status}.`);
  }
}

function getConfiguration(): { baseUrl: string; secret: string } {
  const rawBaseUrl = process.env.PAYLOAD_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
  const secret = process.env.NEWSLETTER_SERVICE_SECRET?.trim();

  if (!rawBaseUrl || !secret) {
    throw new NewsletterServiceConfigurationError("Newsletter service configuration is missing.");
  }

  return { baseUrl: new URL(rawBaseUrl).origin, secret };
}

export async function callNewsletterService<T>(
  operation: NewsletterOperation,
  body: Record<string, string>,
): Promise<T> {
  const { baseUrl, secret } = getConfiguration();
  const response = await fetch(new URL(`/api/newsletter/${operation}`, baseUrl), {
    body: JSON.stringify(body),
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      "x-newsletter-service-secret": secret,
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new NewsletterServiceRequestError(response.status);
  }

  return (await response.json()) as T;
}
