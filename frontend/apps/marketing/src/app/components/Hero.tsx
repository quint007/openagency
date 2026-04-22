"use client";

import {
  Badge,
  Button,
  ContainerTextFlip,
  GridBackground,
  Logo,
} from "@open-agency/ui";
import { ArrowRight } from "pixelarticons/react/ArrowRight";
import { homepageContent } from "../homepage-content";
import styles from "../page.module.css";

export function Hero() {
  const { hero } = homepageContent;

  return (
    <section
      className={`${styles.hero} relative isolate w-full overflow-hidden`}
      id={hero.sectionId}
      aria-labelledby="hero-title"
    >
      <div className="absolute inset-0 z-0 hidden h-full w-full overflow-hidden lg:block">
        <GridBackground className="size-full" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[100rem] flex-col gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20 xl:flex-row xl:items-end xl:justify-between xl:gap-16">
        <div className="flex max-w-[52rem] flex-1 flex-col gap-8 lg:max-w-[42rem] lg:pr-12 xl:max-w-[52rem] xl:pr-0">
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

              {/*<Button
                className="min-h-12 px-7"
                variant="outline"
                render={<a href={hero.secondaryCta.href} />}
                nativeButton={false}
              >
                {hero.secondaryCta.label}
              </Button>*/}
            </div>

            <p className={`${styles.heroSupportingLine} max-w-[38rem]`}>
              {hero.supportingLine}
            </p>
          </div>
        </div>
        <div className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 lg:flex">
          <Logo
            variant="mascot"
            size="xl"
            className="opacity-90"
            mascotClassName="size-72"
          />
        </div>
      </div>
    </section>
  );
}
