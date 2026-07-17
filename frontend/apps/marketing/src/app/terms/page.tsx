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
      intro="Simple terms for using Open Agency content, tools, and public resources."
      title="Terms of use"
    >
      <section className="px-4 sm:px-6 lg:px-8" aria-label="Terms details">
        <div className="mx-auto flex w-full max-w-[64rem] flex-col gap-6 rounded-[1.75rem] border border-[color:color-mix(in_srgb,var(--outline-variant)_45%,transparent)] bg-[color:color-mix(in_srgb,var(--surface-container-lowest)_86%,transparent)] px-6 py-7 text-base leading-8 text-[var(--on-surface-variant)] sm:px-8">
          <p>Open Agency publishes practical AI guides, templates, and tools for learning and operational use. Use them at your own judgment and review outputs before relying on them.</p>
          <p>Unless a repository states a specific open-source license, website copy and guides remain owned by Open Agency.</p>
          <p>Do not abuse forms, infrastructure, or public endpoints. We may limit access if traffic harms the service.</p>
          <p>Questions about these terms can be sent to <a className="text-[var(--brand-primary-light)] underline underline-offset-4" href="mailto:hello@open-agency.io">hello@open-agency.io</a>.</p>
        </div>
      </section>
    </ResourceIndexPage>
  );
}
