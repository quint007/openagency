import type { Metadata } from 'next';
import { LexicalRenderer } from '@open-agency/ui';
import { ArrowLeft } from 'pixelarticons/react/ArrowLeft';
import { Calendar } from 'pixelarticons/react/Calendar';
import { Clock } from 'pixelarticons/react/Clock';
import { User } from 'pixelarticons/react/User';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { MarketingPageFrame } from '../../components/MarketingPageFrame';
import { toAbsoluteUrl } from '../../../lib/site';
import { getBlogDetail, type BlogLevel } from '../blog-data';
import styles from '../blog.module.css';
import { InArticleAd } from './InArticleAd';

type BlogDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = 'force-dynamic';

function getTopLevelLexicalNodeCount(content: unknown): number {
  if (!content || typeof content !== 'object') {
    return 0;
  }

  const root = 'root' in content && content.root && typeof content.root === 'object' ? content.root : content;
  const children = 'children' in root ? root.children : null;

  return Array.isArray(children) ? children.length : 0;
}

function levelBadgeClassName(level: BlogLevel): string {
  return level === 'beginner'
    ? styles.levelBeginner
    : level === 'intermediate'
      ? styles.levelIntermediate
      : styles.levelExpert;
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogDetail(slug);

  if (!post) {
    return {
      title: 'Post not found · Open Agency',
    };
  }

  const ogImage = post.ogImageUrl ?? toAbsoluteUrl(`/blog/${post.slug}/opengraph-image`);

  return {
    alternates: {
      canonical: post.canonicalUrl,
      types: {
        'application/rss+xml': toAbsoluteUrl('/feed.xml'),
      },
    },
    description: post.seoDescription,
    openGraph: {
      authors: post.authors.length > 0 ? post.authors : undefined,
      description: post.seoDescription,
      images: [ogImage],
      publishedTime: post.publishedAtIso ?? undefined,
      title: post.seoTitle,
      type: 'article',
      url: post.canonicalUrl,
    },
    title: `${post.seoTitle} · Open Agency`,
    twitter: {
      card: 'summary_large_image',
      description: post.seoDescription,
      images: [ogImage],
      title: post.seoTitle,
    },
  };
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const post = await getBlogDetail(slug);

  if (!post) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.seoTitle,
    description: post.seoDescription,
    image: post.ogImageUrl ?? undefined,
    datePublished: post.publishedAtIso,
    author: post.authors.length > 0
      ? post.authors.map((name) => ({ '@type': 'Person' as const, name }))
      : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'Open Agency',
      url: toAbsoluteUrl('/'),
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': post.canonicalUrl,
    },
  };

  const topLevelNodeCount = getTopLevelLexicalNodeCount(post.content);
  const adInsertionIndex = topLevelNodeCount <= 3 ? 1 : 3;

  return (
    <MarketingPageFrame mainClassName="flex w-full flex-1 flex-col gap-8 pb-24 sm:gap-10 lg:gap-12">
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <section className="px-4 pt-5 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
        <div className={`${styles.heroSurface} mx-auto flex w-full max-w-[100rem] flex-col gap-5 rounded-[1.5rem] border border-[color:color-mix(in_srgb,var(--outline-variant)_45%,transparent)] px-5 py-5 sm:gap-6 sm:rounded-[2rem] sm:px-8 sm:py-7 lg:px-10 lg:py-8`}>
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.14em] text-[var(--on-surface-variant)] transition-colors hover:text-[var(--on-surface)]">
            <ArrowLeft className="size-5 text-[var(--brand-primary-light)]" />
            Back to all guides
          </Link>

          <div className="flex max-w-[46rem] flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`${styles.eyebrow} rounded-full px-3 py-2`}>{post.category}</span>
              {post.level ? (
                <span className={`${styles.levelBadge} ${levelBadgeClassName(post.level)} rounded-full px-3 py-2`}>
                  {post.level}
                </span>
              ) : null}
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

            <h1 className="max-w-[11ch] text-[clamp(2rem,4vw,3.25rem)] leading-[0.98] tracking-[-0.05em] text-[var(--on-surface)] text-balance">{post.title}</h1>
            <p className="max-w-[38rem] text-[1rem] leading-8 text-[var(--on-surface-variant)] sm:text-[1.05rem] sm:leading-[1.8]">{post.excerpt}</p>
          </div>

          <dl className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-[var(--on-surface-variant)]">
            <div className="inline-flex items-center gap-2">
              <Calendar className="size-5 text-[var(--brand-primary-light)]" />
              <dt className="sr-only">Published</dt>
              <dd>{post.publishedLabel}</dd>
            </div>
            <div className="inline-flex items-center gap-2">
              <Clock className="size-5 text-[var(--brand-primary-light)]" />
              <dt className="sr-only">Reading time</dt>
              <dd>{post.readingTime}</dd>
            </div>
            {post.authors.length > 0 ? (
              <div className="inline-flex items-center gap-2">
                <User className="size-5 text-[var(--brand-primary-light)]" />
                <dt className="sr-only">Authors</dt>
                <dd>{post.authors.join(', ')}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-[100rem] min-w-0 gap-8 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
          <article className={`${styles.panelSurface} ${styles.articleContent} min-w-0 rounded-[1.85rem] border border-[color:color-mix(in_srgb,var(--outline-variant)_45%,transparent)] px-5 py-7 sm:px-8 sm:py-8 lg:px-10`}>
            <LexicalRenderer
              content={post.content}
              className="w-full max-w-[46rem]"
              renderAfterNode={(index) => (index + 1 === adInsertionIndex ? <InArticleAd /> : null)}
            />
          </article>

          <aside className="flex min-w-0 flex-col gap-6 xl:sticky xl:top-28">
            {post.relatedPosts.length > 0 ? (
              <section className={`${styles.panelSurface} rounded-[1.75rem] border border-[color:color-mix(in_srgb,var(--outline-variant)_45%,transparent)] px-5 py-5 sm:px-6`}>
                <div className="flex flex-col gap-4">
                  <p className={styles.kicker}>Related guides</p>
                  <div className="flex flex-col gap-4">
                    {post.relatedPosts.map((relatedPost) => (
                      <a key={relatedPost.id} href={relatedPost.href} className="flex flex-col gap-2 rounded-[1rem] border border-[color:color-mix(in_srgb,var(--outline-variant)_35%,transparent)] px-4 py-4 transition-colors hover:border-[color:color-mix(in_srgb,var(--brand-primary)_40%,transparent)]">
                        <span className={styles.metaText}>{relatedPost.category}</span>
                        <span className="text-[1rem] leading-7 text-[var(--on-surface)]">{relatedPost.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </section>
            ) : null}
          </aside>
        </div>

      </section>
    </MarketingPageFrame>
  );
}
