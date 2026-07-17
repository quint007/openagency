import type { Metadata } from "next";

import { ComingSoonBanner } from "../components/ComingSoon";
import { ResourceIndexPage } from "../(resources)/ResourceIndexPage";
import { homepageContent } from "../homepage-content";

export const metadata: Metadata = {
  alternates: { canonical: "/awesome" },
  description: "Curated open-source agents, workflow systems, and prompt libraries for practical AI work.",
  title: "Awesome Lists · Open Agency",
};

export default function AwesomePage() {
  // Temporary: remove this banner when the awesome lists content is ready.
  return (
    <ResourceIndexPage
      cards={homepageContent.awesomeLists.previews.map((preview) => ({
        ...preview,
        title: preview.label,
      }))}
      banner={<ComingSoonBanner />}
      eyebrow="Awesome lists"
      intro={homepageContent.awesomeLists.description}
      title="Curated AI workflow references"
    />
  );
}
