import type { ReactNode } from "react";
import { ArrowRight } from "pixelarticons/react/ArrowRight";

import { MarketingPageFrame } from "../components/MarketingPageFrame";
import styles from "../blog/blog.module.css";

export type ResourceCard = {
  description: string;
  href: string;
  label: string;
  title: string;
};

type ResourceIndexPageProps = {
  cards?: ResourceCard[];
  children?: ReactNode;
  eyebrow: string;
  intro: string;
  title: string;
};

export function ResourceIndexPage({ cards = [], children, eyebrow, intro, title }: ResourceIndexPageProps) {
  return (
    <MarketingPageFrame mainClassName="flex w-full flex-1 flex-col gap-12 pb-24 sm:gap-16 lg:gap-20 xl:gap-24">
      <section className="px-4 pt-8 sm:px-6 lg:px-8 lg:pt-14" aria-labelledby="resource-page-title">
        <div className={`${styles.heroSurface} mx-auto flex w-full max-w-[100rem] flex-col gap-5 rounded-[1.5rem] border border-[color:color-mix(in_srgb,var(--outline-variant)_45%,transparent)] px-5 py-6 sm:gap-8 sm:rounded-[2rem] sm:px-8 sm:py-10 lg:px-10 lg:py-12`}>
          <span className={`${styles.eyebrow} inline-flex self-start rounded-full px-3 py-2`}>{eyebrow}</span>
          <div className="flex max-w-[58rem] flex-col gap-4">
            <h1 id="resource-page-title" className={`${styles.pageTitle} max-w-[13ch] text-[var(--on-surface)]`}>{title}</h1>
            <p className={`${styles.pageDescription} max-w-[44rem]`}>{intro}</p>
          </div>
        </div>
      </section>

      {cards.length > 0 ? (
        <section className="px-4 sm:px-6 lg:px-8" aria-label={`${title} resources`}>
          <div className="mx-auto grid w-full max-w-[100rem] gap-5 md:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => (
              <article key={card.href} className={`${styles.panelSurface} flex min-h-full flex-col gap-5 rounded-[1.75rem] border border-[color:color-mix(in_srgb,var(--outline-variant)_45%,transparent)] px-6 py-6 sm:px-7`}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`${styles.eyebrow} inline-flex self-start rounded-full px-3 py-2`}>{card.label}</span>
                </div>
                <div className="flex flex-1 flex-col gap-4">
                  <h2 className={`${styles.cardTitle} text-[var(--on-surface)]`}>{card.title}</h2>
                  <p className={styles.cardBody}>{card.description}</p>
                </div>
                <a href={card.href} className="mt-auto inline-flex items-center gap-2 text-sm uppercase tracking-[0.14em] text-[var(--brand-primary-light)] transition-colors hover:text-[var(--on-surface)]">
                  Open resource
                  <ArrowRight className="size-5" />
                </a>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {children}
    </MarketingPageFrame>
  );
}
