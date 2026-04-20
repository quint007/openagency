"use client";

import { Badge, Button, ContainerTextFlip } from "@open-agency/ui";
import { Analytics } from "pixelarticons/react/Analytics";
import { ArrowRight } from "pixelarticons/react/ArrowRight";
import { BookOpen } from "pixelarticons/react/BookOpen";
import { Home } from "pixelarticons/react/Home";
import { homepageContent } from "../homepage-content";
import styles from "../page.module.css";
import { BrandLockup } from "./BrandLockup";
import CybercoreBackground from "./homepage/cybercore-section-hero";

const heroPills = [
  {
    icon: Home,
    label: "Open source systems",
  },
  {
    icon: Analytics,
    label: "Operator-grade workflows",
  },
  {
    icon: BookOpen,
    label: "Guides with working code",
  },
] as const;

export function Hero() {
  const { hero } = homepageContent;

  return (
    <section
      className={`${styles.hero} relative isolate w-full overflow-hidden`}
      id={hero.sectionId}
      aria-labelledby="hero-title"
    >
      <div className="absolute inset-0 z-0 h-full w-full overflow-hidden">
        <CybercoreBackground />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[100rem] flex-col gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20 xl:flex-row xl:items-end xl:justify-between xl:gap-16">
        <div className="flex max-w-[52rem] flex-1 flex-col gap-8">
          <Badge
            variant="outline"
            className={`${styles.eyebrow} inline-flex items-center self-start px-3 py-2`}
          >
            built for people shipping with AI
          </Badge>

          <div className="flex flex-col gap-6">
            <h1 className={`${styles.heroTitle} max-w-[11ch]`} id="hero-title">
              Work{" "}
              <ContainerTextFlip
                words={["faster", "smarter", "calmer"]}
                className="mx-2 inline-flex align-baseline"
                textClassName="text-[inherit]"
              />
            </h1>

            <h2
              className={`${styles.heroTitle} max-w-[13ch] text-[clamp(2.4rem,5vw,4.8rem)]`}
            >
              with AI — not harder with hype.
            </h2>

            <p
              className={`${styles.heroBody} max-w-[46rem] text-base sm:text-lg xl:text-[1.2rem]`}
              id="about"
            >
              {hero.body}
            </p>
          </div>

          <div className="flex flex-col gap-5" id="contact">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Button
                className="min-h-12 px-7"
                render={<a href={hero.primaryCta.href} />}
                nativeButton={false}
              >
                {hero.primaryCta.label}
                <ArrowRight data-icon="inline-end" />
              </Button>

              <Button
                className="min-h-12 px-7"
                variant="outline"
                render={<a href={hero.secondaryCta.href} />}
                nativeButton={false}
              >
                {hero.secondaryCta.label}
              </Button>
            </div>

            <p className={`${styles.heroSupportingLine} max-w-[38rem]`}>
              {hero.supportingLine}
            </p>
          </div>
        </div>

        <div className="flex w-full max-w-[28rem] flex-col gap-4 self-stretch xl:max-w-[30rem] xl:items-end">
          <div
            className={`${styles.heroMarkFrame} flex min-h-[16rem] w-full flex-col justify-between rounded-[2rem] border border-[color:color-mix(in_srgb,var(--brand-primary)_24%,transparent)] p-6 sm:min-h-[18rem]`}
          >
            <div className="flex items-center justify-between gap-4">
              <BrandLockup markOnly />
              <span className="rounded-full border border-[color:color-mix(in_srgb,var(--brand-primary)_26%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_72%,transparent)] px-3 py-1 text-[0.72rem] uppercase tracking-[0.16em] text-[var(--brand-primary)]">
                public beta
              </span>
            </div>

            <div className="flex flex-col gap-4">
              <p className="max-w-[24rem] text-sm leading-7 text-[var(--on-surface-variant)] sm:text-[0.95rem]">
                A calmer operating layer for AI-native teams: clearer prompts,
                better review loops, and reusable systems your team can trust.
              </p>

              <div className="flex flex-wrap gap-3">
                {heroPills.map(({ icon: Icon, label }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-2 rounded-full border border-[color:color-mix(in_srgb,var(--outline-variant)_45%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_80%,transparent)] px-3 py-2 text-sm text-[var(--on-surface)]"
                  >
                    <Icon className="size-5 text-[var(--brand-primary)]" />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
