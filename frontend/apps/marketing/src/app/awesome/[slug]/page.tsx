import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ComingSoonBanner } from "../../components/ComingSoon";
import { ResourceIndexPage } from "../../(resources)/ResourceIndexPage";
import { homepageContent } from "../../homepage-content";

const resources = homepageContent.awesomeLists.previews.map((preview) => ({
  ...preview,
  slug: preview.href.replace("/awesome/", ""),
  title: preview.label,
}));

type AwesomeDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return resources.map((resource) => ({ slug: resource.slug }));
}

export async function generateMetadata({ params }: AwesomeDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const resource = resources.find((item) => item.slug === slug);

  if (!resource) {
    return { title: "Awesome list not found" };
  }

  return {
    alternates: { canonical: resource.href },
    description: resource.description,
    title: `${resource.title} · Awesome Lists`,
  };
}

export default async function AwesomeDetailPage({ params }: AwesomeDetailPageProps) {
  const { slug } = await params;
  const resource = resources.find((item) => item.slug === slug);

  if (!resource) {
    notFound();
  }

  // Temporary: remove this banner when the awesome lists content is ready.
  return (
    <ResourceIndexPage
      cards={resources.filter((item) => item.slug !== slug)}
      banner={<ComingSoonBanner />}
      eyebrow="Awesome list"
      intro={resource.description}
      title={resource.title}
    />
  );
}
