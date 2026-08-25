import type { Metadata } from "next";

import { ResourceIndexPage } from "../(resources)/ResourceIndexPage";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  alternates: { canonical: "/contact" },
  description: "Get in touch with Open Agency.",
  title: "Contact · Open Agency",
};

export default function ContactPage() {
  return (
    <ResourceIndexPage
      eyebrow="Get in touch"
      intro="Questions, feedback, or partnership ideas? Send a message and we will get back to you."
      title="Contact"
    >
      <section className="px-4 sm:px-6 lg:px-8" aria-label="Contact form">
        <div className="mx-auto flex w-full max-w-[64rem] flex-col gap-8 rounded-[1.75rem] border border-[color:color-mix(in_srgb,var(--outline-variant)_45%,transparent)] bg-[color:color-mix(in_srgb,var(--surface-container-lowest)_86%,transparent)] px-6 py-7 text-[var(--on-surface-variant)] sm:px-8">
          <ContactForm />
        </div>
      </section>
    </ResourceIndexPage>
  );
}
