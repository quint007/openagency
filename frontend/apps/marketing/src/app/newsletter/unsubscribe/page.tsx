import type { Metadata } from "next";

import { MarketingPageFrame } from "../../components/MarketingPageFrame";
import { Check } from "pixelarticons/react/Check";
import styles from "../page.module.css";

export const metadata: Metadata = {
  title: "Unsubscribe · Open Agency",
  description: "Unsubscribe from the Open Agency newsletter.",
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <MarketingPageFrame mainClassName="flex w-full flex-1 flex-col gap-12 pb-24 sm:gap-16 lg:gap-20 xl:gap-24">
      <section className="px-4 pt-10 sm:px-6 lg:px-8 lg:pt-14">
        <div className={`${styles.heroSurface} mx-auto flex w-full max-w-[100rem] flex-col gap-8 rounded-[2rem] px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12`}>
          <div className="flex max-w-[52rem] flex-col gap-4">
            <Check className="size-12 text-[var(--brand-primary)]" />
            <h1 className={`${styles.pageTitle}`}>
              {email ? "You are unsubscribed." : "Unsubscribe request received."}
            </h1>
            <p className={styles.pageDescription}>
              {email
                ? `You will no longer receive emails at ${email}.`
                : "Your unsubscribe request has been processed."}
            </p>
            <p className={styles.metaText}>
              If this was a mistake, you can subscribe again at any time.
            </p>
          </div>
        </div>
      </section>
    </MarketingPageFrame>
  );
}