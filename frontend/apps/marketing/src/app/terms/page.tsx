import type { Metadata } from "next";
import { LexicalRenderer } from "@open-agency/ui";
import { getLegalDocument } from "@open-agency/cms-client";

import { ResourceIndexPage } from "../(resources)/ResourceIndexPage";

export const metadata: Metadata = {
  alternates: { canonical: "/terms" },
  description: "Open Agency terms for using the public website, guides, and free resources.",
  title: "Terms · Open Agency",
};

export default async function TermsPage() {
  const document = await getLegalDocument("terms");

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
      intro="Terms for using Open Agency content, tools, and public resources."
      title="Terms of use"
    >
      <section className="px-4 sm:px-6 lg:px-8" aria-label="Terms details">
        <div className="mx-auto flex w-full max-w-[64rem] flex-col gap-6 rounded-[1.75rem] border border-[color:color-mix(in_srgb,var(--outline-variant)_45%,transparent)] bg-[color:color-mix(in_srgb,var(--surface-container-lowest)_86%,transparent)] px-6 py-7 text-base leading-8 text-[var(--on-surface-variant)] sm:px-8">
          <h2 className="font-[var(--brand-font-heading)] text-xl font-semibold tracking-[-0.03em] text-[var(--on-surface)]">
            Using the site
          </h2>
          <p>
            Open Agency publishes practical AI guides, templates, and tools for learning and operational use. Use them at your own judgment and review outputs before relying on them. The content is provided as-is, and we do not guarantee that any guide, tool, or recommendation will fit your specific situation.
          </p>

          <h2 className="font-[var(--brand-font-heading)] text-xl font-semibold tracking-[-0.03em] text-[var(--on-surface)]">
            Intellectual property
          </h2>
          <p>
            Unless a repository states a specific open-source license, website copy and guides remain owned by Open Agency. You may read, share links to, and quote short excerpts for non-commercial purposes with attribution. You may not republish full guides, scrape the site, or resell our content without permission.
          </p>

          <h2 className="font-[var(--brand-font-heading)] text-xl font-semibold tracking-[-0.03em] text-[var(--on-surface)]">
            Open-source software
          </h2>
          <p>
            Some tools and code samples are released under open-source licenses. The license for each repository or file is included in that repository. Use of open-source software is governed by the applicable license terms.
          </p>

          <h2 className="font-[var(--brand-font-heading)] text-xl font-semibold tracking-[-0.03em] text-[var(--on-surface)]">
            Prohibited use
          </h2>
          <p>
            Do not abuse forms, infrastructure, or public endpoints. This includes automated submission of forms, attempts to bypass access controls, scraping that degrades service for others, or any activity that harms the site or its users. We may limit access if traffic harms the service.
          </p>

          <h2 className="font-[var(--brand-font-heading)] text-xl font-semibold tracking-[-0.03em] text-[var(--on-surface)]">
            Disclaimer and liability
          </h2>
          <p>
            Open Agency is provided without warranties of any kind, express or implied. To the extent permitted by law, we are not liable for any damages arising from your use of the site, inability to use the site, or reliance on any content.
          </p>

          <h2 className="font-[var(--brand-font-heading)] text-xl font-semibold tracking-[-0.03em] text-[var(--on-surface)]">
            Governing law
          </h2>
          <p>
            These terms are governed by the laws of the Netherlands, without regard to conflict-of-law principles. Disputes will be resolved in the competent courts of Amsterdam.
          </p>

          <h2 className="font-[var(--brand-font-heading)] text-xl font-semibold tracking-[-0.03em] text-[var(--on-surface)]">
            Changes and questions
          </h2>
          <p>
            We may update these terms from time to time. Continued use of the site after changes means you accept the updated terms. Questions about these terms can be sent to{" "}
            <a className="text-[var(--brand-primary-light)] underline underline-offset-4" href="mailto:hello@open-agency.io">
              hello@open-agency.io
            </a>.
          </p>
        </div>
      </section>
    </ResourceIndexPage>
  );
}
