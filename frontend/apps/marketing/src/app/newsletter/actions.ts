"use server";

import { Resend } from "resend";
import { z } from "zod";
import { WelcomeEmail } from "./emails/WelcomeEmail";
import { render } from "@react-email/render";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const resend = new Resend(process.env.RESEND_API_KEY);

export type NewsletterSignupResult =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; error: string };

export async function newsletterSignup(
  prevState: NewsletterSignupResult,
  formData: FormData
): Promise<NewsletterSignupResult> {
  const email = formData.get("email");

  const result = emailSchema.safeParse({ email });
  if (!result.success) {
    return { status: "error", error: result.error.issues[0]?.message ?? "Invalid email" };
  }

  const validEmail = result.data.email;

  try {
    const html = await render(
      WelcomeEmail({
        email: validEmail,
        baseUrl: process.env.NEXT_PUBLIC_SERVER_URL ?? "https://open-agency.io",
      })
    );

    await resend.emails.send({
      from: "Open Agency <hello@open-agency.io>",
      to: validEmail,
      subject: "Welcome to the Open Agency newsletter!",
      html,
    });

    return { status: "success" };
  } catch (err) {
    console.error("Newsletter signup error:", err);
    return { status: "error", error: "Something went wrong. Please try again." };
  }
}
