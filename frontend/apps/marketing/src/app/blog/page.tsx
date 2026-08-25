import type { Metadata } from 'next';
import Image from 'next/image';
import { ArrowRight } from 'pixelarticons/react/ArrowRight';

import { MarketingPageFrame } from '../components/MarketingPageFrame';
import { toAbsoluteUrl } from '../../lib/site';
import { getFilteredBlogCards, getBlogFilterOptions, type BlogLevel } from './blog-data';
import { BlogFilters } from './BlogFilters';
import styles from './blog.module.css';

type BlogIndexPageProps = {
  readonly searchParams: Promise<{
    readonly category?: string | readonly string[];
    readonly tag?: string | readonly string[];
  }>;
};

function readSingleParam(value: string | readonly string[] | undefined): string | null {
  if (typeof value === 'string') {
    return value;
  }

  return value?.[0] ?? null;
}

function levelBadgeClassName(level: BlogLevel): string {
  return level === 'beginner'
    ? styles.levelBeginner
    : level === 'intermediate'
      ? styles.levelIntermediate
      : styles.levelExpert;
}

export const metadata: Metadata = {
  alternates: {
    canonical: '/blog',
    types: {
      'application/rss+xml': toAbsoluteUrl('/feed.xml'),
    },
  },
  description: 'Browse every published Open Agency guide, filter by topic tag, and go deeper into practical AI workflows.',
  openGraph: {
    description: 'Browse every published Open Agency guide, filter by topic tag, and go deeper into practical AI workflows.',
    siteName: 'Open Agency',
    title: 'Blog · Open Agency',
    type: 'website',
    url: toAbsoluteUrl('/blog'),
  },
  title: 'Blog · Open Agency',
};

export const dynamic = 'force-dynamic';

export default async function BlogIndexPage({ searchParams }: BlogIndexPageProps) {
  const resolvedSearchParams = await searchParams;
  const selectedTag = readSingleParam(resolvedSearchParams.tag);
  const [filterOptions, posts] = await Promise.all([
    getBlogFilterOptions(),
    getFilteredBlogCards({ tag: selectedTag }),
  ]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Open Agency Blog',
    description: 'Practical AI systems guides from the Open Agency team.',
    url: toAbsoluteUrl('/blog'),
    blogPost: posts.map((post) => ({
      '@type': 'BlogPosting' as const,
      headline: post.title,
      description: post.excerpt,
      url: toAbsoluteUrl(post.href),
      datePublished: post.publishedAtIso,
      image: post.thumbnailUrl ?? undefined,
    })),
    publisher: {
      '@type': 'Organization',
      name: 'Open Agency',
      url: toAbsoluteUrl('/'),
    },
  };

  return (
    <MarketingPageFrame mainClassName="flex w-full flex-1 flex-col gap-12 pb-24 sm:gap-16 lg:gap-20 xl:gap-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="px-4 pt-8 sm:px-6 lg:px-8 lg:pt-14">
        <div className={`${styles.heroSurface} mx-auto flex w-full max-w-[100rem] flex-col gap-6 rounded-[1.5rem] border border-[color:color-mix(in_srgb,var(--outline-variant)_45%,transparent)] px-5 py-6 sm:gap-8 sm:rounded-[2rem] sm:px-8 sm:py-10 lg:px-10 lg:py-12`}>
          <div className="flex max-w-[56rem] flex-col gap-3 sm:gap-5">
            <span className={`${styles.eyebrow} inline-flex self-start rounded-full px-3 py-2`}>Open Agency guides</span>
            <h1 className={`${styles.pageTitle} max-w-[12ch] text-[var(--on-surface)]`}>The blog for practical AI systems</h1>
            <p className={`${styles.pageDescription} max-w-[44rem]`}>
              Browse every published guide, filter by topic tag, and go deeper into practical AI workflows.
            </p>
          </div>

          <BlogFilters
            selectedTag={selectedTag}
            tags={filterOptions.tags}
          />
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8" aria-labelledby="blog-index-title">
        <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-6">
          <div className="flex flex-col gap-2">
            <p className={styles.metaText}>
              {posts.length} published {posts.length === 1 ? 'post' : 'posts'}
            </p>
            <h2 id="blog-index-title" className="text-[1.5rem] tracking-[-0.04em] text-[var(--on-surface)] sm:text-[1.75rem]">
              {selectedTag ? 'Filtered guide results' : 'Latest published guides'}
            </h2>
          </div>

          {posts.length === 0 ? (
            <article className={`${styles.panelSurface} rounded-[1.75rem] border border-[color:color-mix(in_srgb,var(--outline-variant)_45%,transparent)] px-6 py-7 sm:px-8`}>
              <div className="flex max-w-[42rem] flex-col gap-3">
                <h3 className={`${styles.cardTitle} text-[var(--on-surface)]`}>No posts match this filter yet.</h3>
                <p className={styles.cardBody}>Try clearing the tag to see the full published guide library.</p>
              </div>
            </article>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className={`${styles.panelSurface} flex h-full flex-col gap-6 rounded-[1.75rem] border border-[color:color-mix(in_srgb,var(--outline-variant)_45%,transparent)] px-6 py-6 sm:px-7`}
                >
                  {post.thumbnailUrl ? (
                    <div className="relative aspect-[16/10] overflow-hidden rounded-[1.2rem] border border-[color:color-mix(in_srgb,var(--brand-primary)_18%,var(--outline-variant)_82%)] bg-[linear-gradient(180deg,var(--surface-container-highest)_0%,var(--surface-container-lowest)_100%)]">
                      <Image
                        src={post.thumbnailUrl}
                        alt={`${post.title} thumbnail`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`${styles.eyebrow} rounded-full px-3 py-2`}>{post.category}</span>
                    {post.level ? (
                      <span className={`${styles.levelBadge} ${levelBadgeClassName(post.level)} rounded-full px-3 py-2`}>
                        {post.level}
                      </span>
                    ) : null}
                    <span className={styles.metaText}>{post.publishedLabel}</span>
                    <span className={styles.metaText}>{post.readingTime}</span>
                  </div>

                  <div className="flex flex-1 flex-col gap-4">
                    <h3 className={`${styles.cardTitle} text-[var(--on-surface)]`}>
                      <a href={post.href} className="transition-colors hover:text-[var(--brand-primary-light)]">
                        {post.title}
                      </a>
                    </h3>
                    <p className={styles.cardBody}>{post.excerpt}</p>
                  </div>

                  <div className="mt-auto flex flex-col gap-4">
                    {post.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                          <a
                            key={tag}
                            href={`/blog?tag=${encodeURIComponent(tag)}`}
                            className="inline-flex rounded-full border border-[color:color-mix(in_srgb,var(--outline-variant)_35%,transparent)] px-3 py-1.5 text-sm text-[var(--on-surface-variant)] transition-colors hover:text-[var(--on-surface)]"
                          >
                            #{tag}
                          </a>
                        ))}
                      </div>
                    ) : null}

                    <a
                      href={post.href}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[color:color-mix(in_srgb,var(--brand-primary)_32%,transparent)] px-4 py-3 text-sm font-medium uppercase tracking-[0.14em] text-[var(--brand-primary-light)] transition-colors hover:border-[color:color-mix(in_srgb,var(--brand-primary)_60%,transparent)] hover:text-[var(--on-surface)] sm:inline-flex sm:w-auto sm:border-0 sm:px-0 sm:py-0 sm:transition-colors sm:hover:text-[var(--on-surface)]"
                    >
                      Read guide
                      <ArrowRight className="size-5" />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </MarketingPageFrame>
  );
}
