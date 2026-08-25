import type { Metadata } from "next";

import { ResourceIndexPage } from "../(resources)/ResourceIndexPage";

export const metadata: Metadata = {
  alternates: { canonical: "/about" },
  description: "What Open Agency is, who builds it, and why it exists.",
  title: "About · Open Agency",
};

export default function AboutPage() {
  return (
    <ResourceIndexPage
      eyebrow="Open Agency"
      intro="Practical AI guides and tools for people who build things. No hype, no paywall, no account required to get started."
      title="About"
    >
      <section className="px-4 sm:px-6 lg:px-8" aria-label="About Open Agency">
        <div className="mx-auto flex w-full max-w-[64rem] flex-col gap-6 rounded-[1.75rem] border border-[color:color-mix(in_srgb,var(--outline-variant)_45%,transparent)] bg-[color:color-mix(in_srgb,var(--surface-container-lowest)_86%,transparent)] px-6 py-7 text-base leading-8 text-[var(--on-surface-variant)] sm:px-8">
          <p>
            Open Agency is a free, open-source publication for engineers, creators, and teams who want to use AI without losing the human review loop. We ship practical guides, working code, and small tools that solve real workflow problems.
          </p>
          <p>
            Everything here is built in public. Our guides cover local models, agent frameworks, cost control, and production tooling. When a guide includes code, you can run it. When we recommend a model or workflow, we explain the trade-offs.
          </p>
          <p>
            The project is maintained by a small group of platform engineers and creators. We fund the work through sponsorships and advertising, and we keep the core content free. If you want to get in touch, email{" "}
            <a className="text-[var(--brand-primary-light)] underline underline-offset-4" href="mailto:hello@open-agency.io">
              hello@open-agency.io
            </a>{" "}
            or use the feedback button on any page.
          </p>
        </div>
      </section>
    </ResourceIndexPage>
  );
}
