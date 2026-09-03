import {
  callNewsletterService,
  NewsletterServiceRequestError,
} from "../../../newsletter/service-client";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const token = new URL(request.url).searchParams.get("t") ?? "";
  const contentType = request.headers.get("content-type") ?? "";
  const body = contentType.includes("application/x-www-form-urlencoded") ? await request.formData() : null;

  if (body?.get("List-Unsubscribe") !== "One-Click") {
    return new Response(null, { status: 400 });
  }

  try {
    const result = await callNewsletterService<{ providerSynced?: boolean }>("unsubscribe", { token });
    if (result.providerSynced === false) {
      return new Response(null, { status: 503 });
    }
  } catch (error) {
    if (error instanceof NewsletterServiceRequestError && error.status === 400) {
      // Invalid and already-used credentials remain indistinguishable to callers.
      return new Response(null, { status: 204 });
    }

    return new Response(null, { status: 503 });
  }

  return new Response(null, { status: 204 });
}
