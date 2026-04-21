import { Card, CardContent, CardHeader, CardTitle } from "@open-agency/ui";
import { ArrowRight } from "pixelarticons/react/ArrowRight";
import { Bookmark } from "pixelarticons/react/Bookmark";
import type { HomepageCardLink } from "../../homepage-content";
import styles from "../../page.module.css";

type CardSectionProps = {
  cards: readonly HomepageCardLink[];
  cardClassName?: string;
  description: string;
  sectionId: string;
  title: string;
  titleId: string;
};

export function CardSection({
  cards,
  cardClassName,
  description,
  sectionId,
  title,
  titleId,
}: CardSectionProps) {
  return (
    <section className="w-full" id={sectionId} aria-labelledby={titleId}>
      <div className={`${styles.sectionSurface} mx-auto flex w-full max-w-[100rem] flex-col gap-10 rounded-[2rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14`}>
        <header className="flex max-w-[42rem] flex-col gap-4">
          <h2 className={styles.sectionTitle} id={titleId}>
            {title}
          </h2>
          <p className={styles.sectionDescription}>{description}</p>
        </header>

        <ul className="flex flex-wrap gap-5">
          {cards.map((card, index) => {
            const cardTitleId = `${sectionId}-card-${index + 1}-title`;

            return (
              <li key={card.label} className="flex min-w-[18rem] flex-1 basis-[22rem]">
                <Card
                  className={`${styles.card} ${cardClassName ?? ""} flex min-h-full w-full flex-col gap-8 rounded-[1.75rem] border border-[color:color-mix(in_srgb,var(--outline-variant)_40%,transparent)] p-6 sm:p-7`.trim()}
                  aria-labelledby={cardTitleId}
                >
                  <CardHeader className="flex flex-col gap-5 p-0">
                    <span className="inline-flex size-11 items-center justify-center rounded-2xl border border-[color:color-mix(in_srgb,var(--brand-primary)_25%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_76%,transparent)] text-[var(--brand-primary)]">
                      <Bookmark className="size-5" />
                    </span>

                    <CardTitle>
                      <h3 id={cardTitleId}>
                        <a className={styles.cardLink} href={card.href}>
                          {card.label}
                        </a>
                      </h3>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col gap-6 p-0">
                    <p className={styles.cardDescription}>{card.description}</p>

                    <span className="mt-auto inline-flex items-center gap-2 text-sm uppercase tracking-[0.14em] text-[var(--brand-primary)]">
                      Explore
                      <ArrowRight className="size-5" />
                    </span>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
