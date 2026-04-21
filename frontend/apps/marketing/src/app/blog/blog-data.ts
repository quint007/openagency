import { calculateReadingTimeFromLexicalContent, extractPlainTextFromLexicalContent } from '@open-agency/ui';
import { getBlogPost, getBlogPosts, type BlogPost } from '@open-agency/cms-client';

import { toAbsoluteMediaUrl, toAbsoluteUrl } from '../../lib/site';

type BlogTag = NonNullable<BlogPost['tags']>[number];
type BlogAuthor = NonNullable<BlogPost['authors']>[number];
type RelatedBlogPost = NonNullable<BlogPost['relatedBlogPosts']>[number];

export type BlogCard = {
  category: string;
  excerpt: string;
  href: `/blog/${string}`;
  id: string;
  publishedAtIso: string | null;
  publishedLabel: string;
  readingTime: string;
  slug: string;
  tags: string[];
  title: string;
};

export type BlogDetail = BlogCard & {
  authors: string[];
  canonicalUrl: string;
  content: unknown;
  ogImageUrl: string | null;
  relatedPosts: BlogCard[];
  seoDescription: string;
  seoTitle: string;
};

export type BlogFilterOptions = {
  categories: string[];
  tags: string[];
};

function getMediaUrl(value: unknown): string | null {
  if (!value || typeof value !== 'object' || !('url' in value)) {
    return null;
  }

  return toAbsoluteMediaUrl(typeof value.url === 'string' ? value.url : null);
}

function cleanText(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function getCategoryTitle(post: BlogPost): string {
  const category = post.category;

  if (category && typeof category === 'object' && 'title' in category && typeof category.title === 'string') {
    return category.title.trim();
  }

  return 'Guide';
}

function getTagLabels(post: BlogPost): string[] {
  return (post.tags ?? [])
    .map((tag: BlogTag) => cleanText(tag?.tag))
    .filter((tag): tag is string => Boolean(tag));
}

function getAuthorNames(post: BlogPost): string[] {
  return (post.authors ?? []).flatMap((author: BlogAuthor) => {
    if (author && typeof author === 'object' && 'name' in author && typeof author.name === 'string') {
      return [author.name.trim()];
    }

    return [];
  });
}

function getExcerpt(post: BlogPost): string {
  const excerpt = cleanText(post.excerpt);

  if (excerpt) {
    return excerpt;
  }

  const fallback = extractPlainTextFromLexicalContent(post.content).slice(0, 180).trim();
  return fallback.length > 0 ? `${fallback}${fallback.length >= 180 ? '…' : ''}` : 'Fresh operating notes from the Open Agency guides library.';
}

function getPublishedDate(post: BlogPost): Date | null {
  const value = cleanText(post.publishedAt);

  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function formatPublishedDate(value: Date | null): string {
  if (!value) {
    return 'Recently published';
  }

  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(value);
}

function slugifyFilterValue(value: string): string {
  return value.trim().toLowerCase();
}

function mapRelatedPost(post: RelatedBlogPost): BlogCard | null {
  if (!post || typeof post !== 'object' || !('slug' in post) || typeof post.slug !== 'string') {
    return null;
  }

  return mapBlogPostToCard(post as BlogPost);
}

export function mapBlogPostToCard(post: BlogPost): BlogCard | null {
  const slug = cleanText(post.slug);
  const title = cleanText(post.title);

  if (!slug || !title) {
    return null;
  }

  const publishedDate = getPublishedDate(post);

  return {
    category: getCategoryTitle(post),
    excerpt: getExcerpt(post),
    href: `/blog/${slug}`,
    id: String(post.id),
    publishedAtIso: publishedDate?.toISOString() ?? null,
    publishedLabel: formatPublishedDate(publishedDate),
    readingTime: calculateReadingTimeFromLexicalContent(post.content),
    slug,
    tags: getTagLabels(post),
    title,
  };
}

export async function getAllBlogCards(): Promise<BlogCard[]> {
  const posts = await getBlogPosts();

  return posts
    .map((post) => mapBlogPostToCard(post))
    .filter((post): post is BlogCard => Boolean(post));
}

export async function getBlogFilterOptions(): Promise<BlogFilterOptions> {
  const cards = await getAllBlogCards();

  return {
    categories: Array.from(new Set(cards.map((card) => card.category))).sort((a, b) => a.localeCompare(b)),
    tags: Array.from(new Set(cards.flatMap((card) => card.tags))).sort((a, b) => a.localeCompare(b)),
  };
}

export async function getFilteredBlogCards(filters: { category?: string | null; tag?: string | null }): Promise<BlogCard[]> {
  const categoryFilter = filters.category ? slugifyFilterValue(filters.category) : null;
  const tagFilter = filters.tag ? slugifyFilterValue(filters.tag) : null;
  const cards = await getAllBlogCards();

  return cards.filter((card) => {
    if (categoryFilter && slugifyFilterValue(card.category) !== categoryFilter) {
      return false;
    }

    if (tagFilter && !card.tags.some((tag) => slugifyFilterValue(tag) === tagFilter)) {
      return false;
    }

    return true;
  });
}

export async function getBlogDetail(slug: string): Promise<BlogDetail | null> {
  const post = await getBlogPost(slug);

  if (!post) {
    return null;
  }

  const card = mapBlogPostToCard(post);

  if (!card) {
    return null;
  }

  const ogImageUrl = getMediaUrl(post.ogImage) ?? getMediaUrl(post.meta?.image);
  const seoTitle = cleanText(post.seoTitle) ?? cleanText(post.meta?.title) ?? card.title;
  const seoDescription = cleanText(post.seoDescription) ?? cleanText(post.meta?.description) ?? card.excerpt;

  return {
    ...card,
    authors: getAuthorNames(post),
    canonicalUrl: toAbsoluteUrl(card.href),
    content: post.content,
    ogImageUrl,
    relatedPosts: (post.relatedBlogPosts ?? [])
      .map((relatedPost: RelatedBlogPost) => mapRelatedPost(relatedPost))
      .filter((relatedPost): relatedPost is BlogCard => Boolean(relatedPost)),
    seoDescription,
    seoTitle,
  };
}

export async function getBlogSlugs(): Promise<Array<{ slug: string }>> {
  const cards = await getAllBlogCards();
  return cards.map((card) => ({ slug: card.slug }));
}
