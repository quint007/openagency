import type { Metadata } from "next";
import { Cancel } from "pixelarticons/react/Cancel";
import { Check } from "pixelarticons/react/Check";
import { MarketingPageFrame } from "../../components/MarketingPageFrame";
import { verifyUnsubscribeToken } from "../actions";
import styles from "../page.module.css";
import { NewsletterConfigurationError } from "../token";
import { UnsubscribeForm } from "./UnsubscribeForm";

export const metadata: Metadata = {
  title: "Unsubscribe · Open Agency",
  description: "Unsubscribe from the Open Agency newsletter.",
};

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ t?: string | string[] }> }) {
  const { t } = await searchParams;
  const token = typeof t === "string" ? t : null;
  let payload: Awaited<ReturnType<typeof verifyUnsubscribeToken>> = null;

  if (token) {
    try {
      payload = await verifyUnsubscribeToken(token);
    } catch (error) {
      if (!(error instanceof NewsletterConfigurationError)) {
        throw error;
      }
    }
  }

  const isError = payload === null;

  return (
    <MarketingPageFrame mainClassName="flex w-full flex-1 flex-col gap-12 pb-24 sm:gap-16 lg:gap-20 xl:gap-24">
      <section className="px-4 pt-10 sm:px-6 lg:px-8 lg:pt-14">
        <div
          className={`${styles.heroSurface} mx-auto flex w-full max-w-[100rem] flex-col gap-8 rounded-[2rem] px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12`}
        >
          <div className="flex max-w-[52rem] flex-col gap-4">
            {isError ? (
              <Cancel className="size-12 text-error" />
            ) : (
              <Check className="size-12 text-[var(--brand-primary)]" />
            )}
            <h1 className={`${styles.pageTitle}`}>
              {isError ? "We could not verify this link." : "Confirm your unsubscribe request."}
            </h1>
            <p className={styles.pageDescription}>
              {isError
                ? "This unsubscribe link is invalid or has expired."
                : `You are about to unsubscribe ${payload?.email ?? ""} from the Open Agency newsletter.`}
            </p>
            {payload && token ? <UnsubscribeForm email={payload.email} token={token} /> : null}
            <p className={styles.metaText}>If this was a mistake, you can subscribe again at any time.</p>
          </div>
        </div>
      </section>
    </MarketingPageFrame>
  );
}
