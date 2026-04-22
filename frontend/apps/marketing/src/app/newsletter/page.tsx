import type { Metadata } from "next";

import { MarketingPageFrame } from "../components/MarketingPageFrame";
import { homepageContent } from "../homepage-content";
import { NewsletterLanding } from "./NewsletterLanding";

export const metadata: Metadata = {
  alternates: {
    canonical: "/newsletter",
  },
  description:
    "Follow the launch countdown and join the Open Agency newsletter waitlist.",
  title: "Newsletter · Open Agency",
};

export default function NewsletterPage() {
  return (
    <MarketingPageFrame mainClassName="flex w-full flex-1 flex-col gap-12 pb-24 sm:gap-16 lg:gap-20 xl:gap-24">
      <NewsletterLanding content={homepageContent.newsletter} />
    </MarketingPageFrame>
  );
}
