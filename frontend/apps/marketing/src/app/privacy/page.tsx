import type { Metadata } from "next";
import { LexicalRenderer } from "@open-agency/ui";
import { getLegalDocument } from "@open-agency/cms-client";

import { ResourceIndexPage } from "../(resources)/ResourceIndexPage";

export const metadata: Metadata = {
  alternates: { canonical: "/privacy" },
  description: "Open Agency privacy policy for newsletter subscribers and site visitors.",
  title: "Privacy · Open Agency",
};

export default async function PrivacyPage() {
  const document = await getLegalDocument("privacy");

  if (document) {
    return (
      <ResourceIndexPage
        eyebrow="Legal"
        intro={document.introduction ?? ""}
        title={document.title}
      >
        <LexicalRenderer content={document.content} />
      </ResourceIndexPage>
    );
  }

  return (
    <ResourceIndexPage
      eyebrow="Legal"
      intro="How Open Agency handles visitor and newsletter data. This page is intentionally plain so it can be reviewed before every production launch."
      title="Privacy policy"
    >
      <section className="px-4 sm:px-6 lg:px-8" aria-label="Privacy details">
        <div className="mx-auto flex w-full max-w-[64rem] flex-col gap-6 rounded-[1.75rem] border border-[color:color-mix(in_srgb,var(--outline-variant)_45%,transparent)] bg-[color:color-mix(in_srgb,var(--surface-container-lowest)_86%,transparent)] px-6 py-7 text-base leading-8 text-[var(--on-surface-variant)] sm:px-8">
          <p>Open Agency collects the email address you submit to the newsletter form so we can send launch updates, guides, and product notes.</p>
          <p>We use Resend to deliver email. We do not sell email addresses, and every newsletter email includes an unsubscribe link.</p>
          <p>We may receive standard hosting logs from our infrastructure providers for security, debugging, and abuse prevention.</p>
          <p>For privacy requests, email <a className="text-[var(--brand-primary-light)] underline underline-offset-4" href="mailto:hello@open-agency.io">hello@open-agency.io</a>.</p>
        </div>
      </section>
    </ResourceIndexPage>
  );
}
