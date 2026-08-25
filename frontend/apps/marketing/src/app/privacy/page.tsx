import type { Metadata } from "next";
import { LexicalRenderer } from "@open-agency/ui";
import { getLegalDocument } from "@open-agency/cms-client";

import { ResourceIndexPage } from "../(resources)/ResourceIndexPage";

export const metadata: Metadata = {
  alternates: { canonical: "/privacy" },
  description: "Open Agency privacy policy for newsletter subscribers, site visitors, and advertising partners.",
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
      intro="How Open Agency handles visitor and newsletter data, cookies, and advertising."
      title="Privacy policy"
    >
      <section className="px-4 sm:px-6 lg:px-8" aria-label="Privacy details">
        <div className="mx-auto flex w-full max-w-[64rem] flex-col gap-6 rounded-[1.75rem] border border-[color:color-mix(in_srgb,var(--outline-variant)_45%,transparent)] bg-[color:color-mix(in_srgb,var(--surface-container-lowest)_86%,transparent)] px-6 py-7 text-base leading-8 text-[var(--on-surface-variant)] sm:px-8">
          <h2 className="font-[var(--brand-font-heading)] text-xl font-semibold tracking-[-0.03em] text-[var(--on-surface)]">
            What we collect
          </h2>
          <p>
            Open Agency collects the email address you submit to the newsletter form so we can send launch updates, guides, and product notes. We use{" "}
            <a className="text-[var(--brand-primary-light)] underline underline-offset-4" href="https://resend.com" rel="noopener noreferrer" target="_blank">
              Resend
            </a>{" "}
            to deliver email. We do not sell email addresses, and every newsletter email includes an unsubscribe link.
          </p>

          <h2 className="font-[var(--brand-font-heading)] text-xl font-semibold tracking-[-0.03em] text-[var(--on-surface)]">
            Cookies and advertising
          </h2>
          <p>
            We use cookies to keep the site working and, with your consent, to support analytics and advertising. You can manage your choices at any time on the{" "}
            <a className="text-[var(--brand-primary-light)] underline underline-offset-4" href="/privacy/cookies">
              cookie preferences
            </a>{" "}
            page or through the cookie settings button.
          </p>
          <p>
            Open Agency participates in the Google AdSense program. If you consent to advertising cookies, Google may place cookies or use advertising identifiers to show personalized or non-personalized ads. Google may collect and process data about your visit in accordance with its own privacy practices. You can learn more about how Google uses data at{" "}
            <a className="text-[var(--brand-primary-light)] underline underline-offset-4" href="https://policies.google.com/technologies/partner-sites" rel="noopener noreferrer" target="_blank">
              Google&apos;s partner sites policy
            </a>{" "}
            and manage your ad preferences through{" "}
            <a className="text-[var(--brand-primary-light)] underline underline-offset-4" href="https://myadcenter.google.com" rel="noopener noreferrer" target="_blank">
              My Ad Center
            </a>.
          </p>

          <h2 className="font-[var(--brand-font-heading)] text-xl font-semibold tracking-[-0.03em] text-[var(--on-surface)]">
            Analytics
          </h2>
          <p>
            If you consent to analytics cookies, we use Google Analytics to understand which pages and resources are useful. Google Analytics processes aggregated, non-identifying visit data on our behalf.
          </p>

          <h2 className="font-[var(--brand-font-heading)] text-xl font-semibold tracking-[-0.03em] text-[var(--on-surface)]">
            Hosting and security
          </h2>
          <p>
            We may receive standard hosting logs from our infrastructure providers for security, debugging, and abuse prevention. These logs may include your IP address, browser type, requested pages, and timestamps. We keep them only as long as necessary for those purposes.
          </p>

          <h2 className="font-[var(--brand-font-heading)] text-xl font-semibold tracking-[-0.03em] text-[var(--on-surface)]">
            Your rights
          </h2>
          <p>
            Depending on where you live, you may have the right to access, correct, delete, or restrict processing of your personal data. You can also withdraw consent for optional cookies at any time. To exercise any of these rights, email{" "}
            <a className="text-[var(--brand-primary-light)] underline underline-offset-4" href="mailto:hello@open-agency.io">
              hello@open-agency.io
            </a>.
          </p>

          <h2 className="font-[var(--brand-font-heading)] text-xl font-semibold tracking-[-0.03em] text-[var(--on-surface)]">
            Changes to this policy
          </h2>
          <p>
            We may update this privacy policy as the site evolves. Significant changes will be reflected on this page with an updated effective date.
          </p>
        </div>
      </section>
    </ResourceIndexPage>
  );
}
