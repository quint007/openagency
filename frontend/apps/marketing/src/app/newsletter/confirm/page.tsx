import type { Metadata } from "next";
import { Cancel } from "pixelarticons/react/Cancel";
import { Check } from "pixelarticons/react/Check";

import { MarketingPageFrame } from "../../components/MarketingPageFrame";
import { inspectNewsletterToken } from "../actions";
import styles from "../page.module.css";
import { NewsletterServiceConfigurationError } from "../service-client";
import { TokenUrlScrubber } from "../TokenUrlScrubber";
import { ConfirmForm } from "./ConfirmForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Confirm newsletter subscription · Open Agency",
  description: "Confirm your Open Agency newsletter subscription.",
  robots: { follow: false, index: false },
};

export default async function ConfirmNewsletterPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string | string[] }>;
}) {
  const { t } = await searchParams;
  const token = typeof t === "string" ? t : null;
  let valid = false;

  if (token) {
    try {
      valid = await inspectNewsletterToken("confirmation", token);
    } catch (error) {
      if (!(error instanceof NewsletterServiceConfigurationError)) throw error;
    }
  }

  return (
    <MarketingPageFrame mainClassName="flex w-full flex-1 flex-col gap-12 pb-24">
      <TokenUrlScrubber />
      <section className="px-4 pt-10 sm:px-6 lg:px-8 lg:pt-14">
        <div className={`${styles.heroSurface} mx-auto flex w-full max-w-[100rem] flex-col gap-8 rounded-[2rem] px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12`}>
          <div className="flex max-w-[52rem] flex-col gap-4">
            {valid ? <Check className="size-12 text-[var(--brand-primary)]" /> : <Cancel className="size-12 text-error" />}
            <h1 className={styles.pageTitle}>{valid ? "Confirm your subscription." : "We could not verify this link."}</h1>
            <p className={styles.pageDescription}>
              {valid
                ? "Confirm that you want the weekly Open Agency newsletter about practical AI workflows, guides, and tools."
                : "This confirmation link is invalid or has expired. You can request a new link from the homepage."}
            </p>
            {valid && token ? <ConfirmForm token={token} /> : null}
          </div>
        </div>
      </section>
    </MarketingPageFrame>
  );
}
