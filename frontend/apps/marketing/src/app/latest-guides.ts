import { getBlogPosts, type BlogPost } from "@open-agency/cms-client";
import type { LatestGuideCard, LatestGuidesSectionState } from "./components/homepage/LatestGuidesSection";

type BlogTag = NonNullable<BlogPost["tags"]>[number];

function getCategoryLabel(post: BlogPost): string {
  const category = post.category;

  if (category && typeof category === "object" && "title" in category && typeof category.title === "string") {
    return category.title;
  }

  return "Guide";
}

function getMetaLabel(post: BlogPost): string {
  if (post.publishedAt) {
    const publishedAt = new Date(post.publishedAt);

    if (!Number.isNaN(publishedAt.valueOf())) {
      return new Intl.DateTimeFormat("en", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(publishedAt);
    }
  }

  const firstTag = post.tags?.find((tag: BlogTag) => typeof tag.tag === "string" && tag.tag.trim().length > 0)?.tag;

  return firstTag?.trim() || "Recently published";
}

function escapeSvgText(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function createGuideArtwork(post: BlogPost): string {
  const category = escapeSvgText(getCategoryLabel(post).toUpperCase());
  const title = escapeSvgText(post.title);

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 750" role="img" aria-label="${title}"><defs><linearGradient id="guide-gradient" x1="0%" x2="100%" y1="0%" y2="100%"><stop offset="0%" stop-color="#25144f" /><stop offset="100%" stop-color="#7c3aed" /></linearGradient></defs><rect width="1200" height="750" fill="url(#guide-gradient)" rx="56" /><circle cx="1030" cy="170" r="180" fill="#f59e0b" fill-opacity="0.24" /><circle cx="210" cy="620" r="210" fill="#38bdf8" fill-opacity="0.22" /><rect x="72" y="72" width="270" height="58" rx="29" fill="#ffffff" fill-opacity="0.12" /><text x="104" y="110" fill="#f8fafc" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="700" letter-spacing="6">${category}</text><text x="72" y="478" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-size="64" font-weight="700">OPEN</text><text x="72" y="550" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-size="64" font-weight="700">AGENCY</text><text x="72" y="636" fill="#e2e8f0" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="500">${title}</text></svg>`,
  )}`;
}

function mapBlogPostToGuideCard(post: BlogPost): LatestGuideCard {
  return {
    category: getCategoryLabel(post),
    description: post.excerpt,
    href: `/blog/${post.slug}`,
    id: String(post.id),
    image: createGuideArtwork(post),
    meta: getMetaLabel(post),
    title: post.title,
  };
}

export async function getLatestGuidesSectionState(): Promise<LatestGuidesSectionState> {
  try {
    const blogPosts = await getBlogPosts();

    if (blogPosts.length === 0) {
      return { kind: "empty" };
    }

    return {
      guides: blogPosts.slice(0, 4).map(mapBlogPostToGuideCard),
      kind: "ready",
    };
  } catch {
    return { kind: "error" };
  }
}
