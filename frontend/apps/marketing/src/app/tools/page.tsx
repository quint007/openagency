import type { Metadata } from "next";

import { ComingSoonBanner } from "../components/ComingSoon";
import { ResourceIndexPage } from "../(resources)/ResourceIndexPage";
import { homepageContent } from "../homepage-content";

export const metadata: Metadata = {
  alternates: { canonical: "/tools" },
  description: "Free Open Agency tools for briefing, launch checks, and human review of AI-assisted work.",
  title: "Tools · Open Agency",
};

export default function ToolsPage() {
  // Temporary: remove this banner when the tools content is ready.
  return (
    <ResourceIndexPage
      cards={homepageContent.toolsTeaser.cards.map((card) => ({
        ...card,
        title: card.label,
      }))}
      banner={<ComingSoonBanner />}
      eyebrow="Tools"
      intro={homepageContent.toolsTeaser.description}
      title="Free tools for cleaner AI work"
    />
  );
}
