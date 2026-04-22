import styles from "./page.module.css";
import { BrandLockup } from "./components/BrandLockup";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { homepageContent } from "./homepage-content";
import { getLatestGuidesSectionState } from "./latest-guides";
import { AwesomeListsSection } from "./components/homepage/AwesomeListsSection";
import { FooterSection } from "./components/homepage/FooterSection";
import { LatestGuidesSection } from "./components/homepage/LatestGuidesSection";
import { NewsletterSection } from "./components/homepage/NewsletterSection";
import { StartHereSection } from "./components/homepage/StartHereSection";
import { ToolsTeaserSection } from "./components/homepage/ToolsTeaserSection";
import { TrustBarSection } from "./components/homepage/TrustBarSection";

export default async function Home() {
  const {
    awesomeLists,
    footer,
    latestGuides,
    newsletter,
    startHere,
    toolsTeaser,
    trustBar,
  } = homepageContent;
  const latestGuidesState = await getLatestGuidesSectionState();

  return (
    <div className={`${styles.page} flex min-h-full w-full flex-col`}>
      <Header brand={<BrandLockup />} />

      <main className="flex w-full flex-col gap-12 pb-24 sm:gap-16 lg:gap-20 xl:gap-24">
        <Hero />
        <LatestGuidesSection content={latestGuides} state={latestGuidesState} />
        {/*<StartHereSection content={startHere} />
        <TrustBarSection content={trustBar} />
        <AwesomeListsSection content={awesomeLists} />
        <ToolsTeaserSection content={toolsTeaser} />*/}
        <NewsletterSection content={newsletter} />
      </main>

      <footer className={styles.footer}>
        <FooterSection content={footer} />
      </footer>
    </div>
  );
}
