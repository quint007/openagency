import type { Metadata } from "next";
import { LexicalRenderer } from "@open-agency/ui";
import { getLegalDocument } from "@open-agency/cms-client";

import { ResourceIndexPage } from "../(resources)/ResourceIndexPage";

export const metadata: Metadata = {
  alternates: { canonical: "/privacy" },
  description: "Open Agency privacy notice.",
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
      intro="The current privacy notice could not be loaded."
      title="Privacy notice unavailable"
    >
      <section className="px-4 sm:px-6 lg:px-8" aria-label="Privacy notice status">
        <div className="mx-auto flex w-full max-w-[64rem] flex-col gap-6 rounded-[1.75rem] border border-[color:color-mix(in_srgb,var(--outline-variant)_45%,transparent)] bg-[color:color-mix(in_srgb,var(--surface-container-lowest)_86%,transparent)] px-6 py-7 text-base leading-8 text-[var(--on-surface-variant)] sm:px-8">
          <h2 className="font-[var(--brand-font-heading)] text-xl font-semibold tracking-[-0.03em] text-[var(--on-surface)]">
            Please try again later
          </h2>
          <p>
            <a className="text-[var(--brand-primary-light)] underline underline-offset-4" href="mailto:hello@open-agency.io">
              hello@open-agency.io
            </a>{" "}
            can provide the current notice while this page is unavailable.
          </p>
        </div>
      </section>
    </ResourceIndexPage>
  );
}
