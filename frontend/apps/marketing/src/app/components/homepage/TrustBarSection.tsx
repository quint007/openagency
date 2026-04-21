import { Card, CardContent } from "@open-agency/ui";
import { Check } from "pixelarticons/react/Check";
import { Home } from "pixelarticons/react/Home";
import { Search } from "pixelarticons/react/Search";
import type { HomepageContent } from "../../homepage-content";
import styles from "../../page.module.css";

type TrustBarSectionProps = {
  content: HomepageContent["trustBar"];
};

const trustIcons = [Check, Search, Home] as const;

export function TrustBarSection({ content }: TrustBarSectionProps) {
  return (
    <section className="w-full" id="solutions" aria-label={content.ariaLabel}>
      <div className="mx-auto flex w-full max-w-[100rem] -translate-y-0 flex-col px-4 sm:px-6 lg:px-8">
        <ul className="flex flex-wrap gap-4" aria-label={content.ariaLabel}>
          {content.statements.map((statement, index) => {
            const Icon = trustIcons[index % trustIcons.length];

            return (
              <li key={statement} className="flex min-w-[18rem] flex-1 basis-[20rem]">
                <Card
                  size="sm"
                  className={`${styles.trustBarCard} flex min-h-full w-full flex-col rounded-[1.5rem] border border-[color:color-mix(in_srgb,var(--outline-variant)_36%,transparent)] p-5 sm:p-6`}
                >
                  <CardContent className="flex flex-1 items-start gap-4 p-0">
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl border border-[color:color-mix(in_srgb,var(--brand-primary)_25%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_78%,transparent)] text-[var(--brand-primary)]">
                      <Icon className="size-5" />
                    </span>
                    <p className={styles.trustBarText}>{statement}</p>
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
