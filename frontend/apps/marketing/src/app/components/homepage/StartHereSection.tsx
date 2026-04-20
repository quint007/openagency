import { Badge, Button, Card, CardContent, CardFooter, CardHeader, CardTitle } from "@open-agency/ui";
import { ArrowRight } from "pixelarticons/react/ArrowRight";
import { Search } from "pixelarticons/react/Search";
import { Home } from "pixelarticons/react/Home";
import { Mail } from "pixelarticons/react/Mail";
import { Analytics } from "pixelarticons/react/Analytics";
import type { HomepageContent } from "../../homepage-content";
import styles from "../../page.module.css";

type StartHereSectionProps = {
  content: HomepageContent["startHere"];
};

const startHereIcons = [Home, Search, Mail, Analytics] as const;

export function StartHereSection({ content }: StartHereSectionProps) {
  return (
    <section
      className="w-full"
      id="start-here"
      aria-labelledby="start-here-title"
    >
      <div className={`${styles.sectionSurface} mx-auto flex w-full max-w-[100rem] flex-col gap-10 rounded-[2rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14`}>
        <header className="flex max-w-[42rem] flex-col gap-4">
          <h2 className={styles.sectionTitle} id="start-here-title">
            {content.title}
          </h2>
          <p className={styles.sectionDescription}>{content.description}</p>
        </header>

        <ul className="flex flex-wrap gap-5">
          {content.cards.map((card, index) => {
            const titleId = `start-here-card-${index + 1}-title`;
            const Icon = startHereIcons[index % startHereIcons.length];

            return (
              <li key={card.title} className="flex min-w-[18rem] flex-1 basis-[22rem]">
                <Card
                  className={`${styles.startHereCard} flex min-h-full w-full flex-col gap-8 rounded-[1.75rem] border border-[color:color-mix(in_srgb,var(--outline-variant)_40%,transparent)] p-6 sm:p-7`}
                  aria-labelledby={titleId}
                >
                  <CardHeader className="flex flex-col gap-4 p-0">
                    <div className="flex items-center justify-between gap-3">
                      <Badge variant="outline" className="justify-self-start">
                        {card.label}
                      </Badge>
                      <span className="inline-flex size-11 items-center justify-center rounded-2xl border border-[color:color-mix(in_srgb,var(--brand-tertiary)_30%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_74%,transparent)] text-[var(--brand-tertiary)]">
                        <Icon className="size-5" />
                      </span>
                    </div>

                    <CardTitle>
                      <h3 className={styles.startHereCardTitle} id={titleId}>
                        {card.title}
                      </h3>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-0">
                    <p className={styles.startHereBody}>{card.body}</p>
                  </CardContent>

                  <CardFooter className="mt-auto p-0">
                    <Button variant="link" size="sm" render={<a href={card.cta.href} />} nativeButton={false}>
                      {card.cta.label}
                      <ArrowRight data-icon="inline-end" />
                    </Button>
                  </CardFooter>
                </Card>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
