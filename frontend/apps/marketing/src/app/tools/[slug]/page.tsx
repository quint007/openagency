import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ComingSoonBanner } from "../../components/ComingSoon";
import { ResourceIndexPage } from "../../(resources)/ResourceIndexPage";
import { homepageContent } from "../../homepage-content";

const tools = homepageContent.toolsTeaser.cards.map((card) => ({
  ...card,
  slug: card.href.replace("/tools/", ""),
  title: card.label,
}));

type ToolDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: ToolDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = tools.find((item) => item.slug === slug);

  if (!tool) {
    return { title: "Tool not found" };
  }

  return {
    alternates: { canonical: tool.href },
    description: tool.description,
    title: `${tool.title} · Tools`,
  };
}

export default async function ToolDetailPage({ params }: ToolDetailPageProps) {
  const { slug } = await params;
  const tool = tools.find((item) => item.slug === slug);

  if (!tool) {
    notFound();
  }

  // Temporary: remove this banner when the tools content is ready.
  return (
    <ResourceIndexPage
      cards={tools.filter((item) => item.slug !== slug)}
      banner={<ComingSoonBanner />}
      eyebrow="Tool"
      intro={tool.description}
      title={tool.title}
    />
  );
}
