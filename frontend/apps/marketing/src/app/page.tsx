import { Button, Logo } from "@open-agency/ui";
import { ArrowRight } from "pixelarticons/react/ArrowRight";

import { AwesomeListsSection } from "./components/homepage/AwesomeListsSection";
import { LatestGuidesSection } from "./components/homepage/LatestGuidesSection";
import { NewsletterSection } from "./components/homepage/NewsletterSection";
import { StartHereSection } from "./components/homepage/StartHereSection";
import { ToolsTeaserSection } from "./components/homepage/ToolsTeaserSection";
import { TrustBarSection } from "./components/homepage/TrustBarSection";
import { MarketingPageFrame } from "./components/MarketingPageFrame";
import { homepageContent } from "./homepage-content";
import { getLatestGuidesSectionState } from "./latest-guides";
import styles from "./page.module.css";

export default async function Home() {
  const latestGuidesState = await getLatestGuidesSectionState();

  return (
    <MarketingPageFrame mainClassName="flex w-full flex-1 flex-col gap-12 pb-24 sm:gap-16 lg:gap-20 xl:gap-24">
      <section
        className="px-4 pt-8 sm:px-6 lg:px-8 lg:pt-14"
        id={homepageContent.hero.sectionId}
        aria-labelledby="homepage-hero-title"
      >
        <div className={`${styles.hero} relative mx-auto flex w-full max-w-[100rem] flex-col gap-8 overflow-hidden rounded-[2rem] px-5 py-8 sm:px-8 sm:py-10 lg:flex-row lg:items-center lg:justify-between lg:px-10 lg:py-14`}>
          <div className="relative z-10 flex max-w-[54rem] flex-col gap-6">
            {homepageContent.hero.eyebrow ? (
              <span className={`${styles.eyebrow} inline-flex self-start rounded-full px-3 py-2`}>
                {homepageContent.hero.eyebrow}
              </span>
            ) : null}
            <div className="flex flex-col gap-3">
              <h1 id="homepage-hero-title" className={`${styles.heroTitle} max-w-[12ch] text-[var(--on-surface)]`}>
                {homepageContent.hero.title}
              </h1>
              <p className={`${styles.heroBody} max-w-[44rem]`}>{homepageContent.hero.body}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button className="min-h-12 px-6" render={<a href={homepageContent.hero.primaryCta.href} />} nativeButton={false}>
                {homepageContent.hero.primaryCta.label}
                <ArrowRight data-icon="inline-end" />
              </Button>
              <Button className="min-h-12 px-6" variant="outline" render={<a href={homepageContent.hero.secondaryCta.href} />} nativeButton={false}>
                {homepageContent.hero.secondaryCta.label}
              </Button>
            </div>
            <p className={styles.heroSupportingLine}>{homepageContent.hero.supportingLine}</p>
          </div>

          <div className={`${styles.heroMarkFrame} relative z-10 flex w-full max-w-[24rem] flex-col gap-5 rounded-[1.75rem] border border-[color:color-mix(in_srgb,var(--outline-variant)_40%,transparent)] p-6`}>
            <Logo ariaLabel="Open Agency" size="lg" variant="mascot" />
            <div className="flex flex-col gap-3">
              <p className={styles.panelTitle}>Open source systems</p>
              <p className={styles.panelBody}>Guides, tools, and repeatable workflows for building with AI without hiding the human review loop.</p>
            </div>
          </div>
        </div>
      </section>

      <TrustBarSection content={homepageContent.trustBar} />
      <StartHereSection content={homepageContent.startHere} />
      <LatestGuidesSection content={homepageContent.latestGuides} state={latestGuidesState} />
      <AwesomeListsSection content={homepageContent.awesomeLists} />
      <ToolsTeaserSection content={homepageContent.toolsTeaser} />
      <NewsletterSection content={homepageContent.newsletter} />
    </MarketingPageFrame>
  );
}
