import type { Metadata } from 'next';
import { ArrowRight } from 'pixelarticons/react/ArrowRight';

import { MarketingPageFrame } from '../components/MarketingPageFrame';
import { getFilteredBlogCards, getBlogFilterOptions } from './blog-data';
import { BlogFilters } from './BlogFilters';
import styles from './blog.module.css';

type BlogIndexPageProps = {
  searchParams: Promise<{ category?: string | string[]; tag?: string | string[] }>;
};

function readSingleParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export const metadata: Metadata = {
  alternates: {
    canonical: '/blog',
  },
  description: 'Browse every published Open Agency guide, filter by category and tag, and go deeper into practical AI workflows.',
  title: 'Blog · Open Agency',
};

export const dynamic = 'force-dynamic';

export default async function BlogIndexPage({ searchParams }: BlogIndexPageProps) {
  const resolvedSearchParams = await searchParams;
  const selectedCategory = readSingleParam(resolvedSearchParams.category);
  const selectedTag = readSingleParam(resolvedSearchParams.tag);
  const [filterOptions, posts] = await Promise.all([
    getBlogFilterOptions(),
    getFilteredBlogCards({ category: selectedCategory, tag: selectedTag }),
  ]);

  return (
    <MarketingPageFrame mainClassName="flex w-full flex-1 flex-col gap-12 pb-24 sm:gap-16 lg:gap-20 xl:gap-24">
      <section className="px-4 pt-10 sm:px-6 lg:px-8 lg:pt-14">
        <div className={`${styles.heroSurface} mx-auto flex w-full max-w-[100rem] flex-col gap-8 rounded-[2rem] border border-[color:color-mix(in_srgb,var(--outline-variant)_45%,transparent)] px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12`}>
          <div className="flex max-w-[56rem] flex-col gap-5">
            <span className={`${styles.eyebrow} inline-flex self-start rounded-full px-3 py-2`}>Open Agency guides</span>
            <h1 className={`${styles.pageTitle} max-w-[12ch] text-[var(--on-surface)]`}>The blog for practical AI systems</h1>
            <p className={`${styles.pageDescription} max-w-[44rem]`}>
              Published notes from the Open Agency CMS, styled with the same sharp homepage language and filterable by the topics teams actually browse for.
            </p>
          </div>

          <BlogFilters
            categories={filterOptions.categories}
            selectedCategory={selectedCategory}
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
              {selectedCategory || selectedTag ? 'Filtered guide results' : 'Latest published guides'}
            </h2>
          </div>

          {posts.length === 0 ? (
            <article className={`${styles.panelSurface} rounded-[1.75rem] border border-[color:color-mix(in_srgb,var(--outline-variant)_45%,transparent)] px-6 py-7 sm:px-8`}>
              <div className="flex max-w-[42rem] flex-col gap-3">
                <h3 className={`${styles.cardTitle} text-[var(--on-surface)]`}>No posts match this filter yet.</h3>
                <p className={styles.cardBody}>Try clearing a category or tag to see the full published guide library.</p>
              </div>
            </article>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className={`${styles.panelSurface} flex h-full flex-col gap-6 rounded-[1.75rem] border border-[color:color-mix(in_srgb,var(--outline-variant)_45%,transparent)] px-6 py-6 sm:px-7`}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`${styles.eyebrow} rounded-full px-3 py-2`}>{post.category}</span>
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

                    <a href={post.href} className="inline-flex items-center gap-2 text-sm font-medium uppercase tracking-[0.14em] text-[var(--brand-primary-light)] transition-colors hover:text-[var(--on-surface)]">
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
