import type { Metadata } from 'next';
import Image from 'next/image';

import { MarketingPageFrame } from '../../components/MarketingPageFrame';
import styles from '../blog.module.css';

// Solid-color placeholder thumbnails as data URIs so no external service is needed.
const THUMB_BLUE = 'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22800%22%20height%3D%22500%22%3E%3Crect%20fill%3D%22%230a1628%22%20width%3D%22800%22%20height%3D%22500%22%2F%3E%3Ccircle%20fill%3D%22%2306b6d4%22%20cx%3D%22400%22%20cy%3D%22250%22%20r%3D%2280%22%20opacity%3D%220.25%22%2F%3E%3Ctext%20fill%3D%22%2306b6d4%22%20font-family%3D%22system-ui%22%20font-size%3D%2224%22%20text-anchor%3D%22middle%22%20x%3D%22400%22%20y%3D%22260%22%3EAi%26%23038%3BThumbnail%3C%2Ftext%3E%3C%2Fsvg%3E';
const THUMB_GREEN = 'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22800%22%20height%3D%22500%22%3E%3Crect%20fill%3D%22%23061a12%22%20width%3D%22800%22%20height%3D%22500%22%2F%3E%3Crect%20x%3D%22300%22%20y%3D%22150%22%20width%3D%22200%22%20height%3D%22200%22%20rx%3D%2220%22%20fill%3D%22%2310b981%22%20opacity%3D%220.3%22%2F%3E%3Ctext%20fill%3D%22%2310b981%22%20font-family%3D%22system-ui%22%20font-size%3D%2220%22%20text-anchor%3D%22middle%22%20x%3D%22400%22%20y%3D%22260%22%3E%F0%9F%94%A7%20Guide%3C%2Ftext%3E%3C%2Fsvg%3E';

const MOCK_CARDS = [
  {
    id: 'preview-1',
    title: 'The Commoditization of Free Inference',
    excerpt: 'Free hosted models are reshaping how teams prototype and evaluate AI. Here is what the architecture looks like.',
    category: 'Architecture',
    publishedLabel: '31 May 2026',
    readingTime: '12 min read',
    thumbnailUrl: THUMB_BLUE,
    href: '#',
    tags: ['ai', 'free-models', 'architecture'],
  },
  {
    id: 'preview-2',
    title: 'Running Kimi K2.6 Locally on a Budget',
    excerpt: 'Can you really run a 230B model on consumer hardware? The honest answer is more nuanced than the benchmarks suggest.',
    category: 'Engineering',
    publishedLabel: '28 May 2026',
    readingTime: '8 min read',
    thumbnailUrl: THUMB_GREEN,
    href: '#',
    tags: ['local-ai', 'hardware'],
  },
  {
    id: 'preview-3',
    title: 'Token Optimization for AI Coding Agents',
    excerpt: 'How RTK reduces token waste by 40 percent with smart shell output filtering and grouping.',
    category: 'Guide',
    publishedLabel: '25 May 2026',
    readingTime: '6 min read',
    thumbnailUrl: null,
    href: '#',
    tags: ['tokens', 'coding'],
  },
] as const;

export const metadata: Metadata = {
  description: 'Preview of blog post thumbnail rendering - listing cards and detail hero.',
  robots: { index: false },
  title: 'Thumbnail Preview · Open Agency',
};

export default function ThumbnailPreviewPage() {
  return (
    <MarketingPageFrame mainClassName="flex w-full flex-1 flex-col gap-12 pb-24 sm:gap-16 lg:gap-20 xl:gap-24">
      <section aria-label="Listing cards preview" className="px-4 pt-10 sm:px-6 lg:px-8 lg:pt-14">
        <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-6">
          <div className="flex flex-col gap-2">
            <p className={styles.metaText}>Blog listing cards</p>
            <h1 className="text-[1.5rem] tracking-[-0.04em] text-[var(--on-surface)] sm:text-[1.75rem]">
              How thumbnails look in the guide grid
            </h1>
            <p className={styles.cardBody}>
              Cards 1 &amp; 2 have thumbnails. Card 3 has none (prevents bloat when no image is uploaded).
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {MOCK_CARDS.map((post) => (
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
                    />
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-3">
                  <span className={`${styles.eyebrow} rounded-full px-3 py-2`}>{post.category}</span>
                  <span className={styles.metaText}>{post.publishedLabel}</span>
                  <span className={styles.metaText}>{post.readingTime}</span>
                </div>

                <div className="flex flex-1 flex-col gap-4">
                  <h3 className={`${styles.cardTitle} text-[var(--on-surface)]`}>
                    <span>{post.title}</span>
                  </h3>
                  <p className={styles.cardBody}>{post.excerpt}</p>
                </div>

                <div className="mt-auto flex flex-col gap-4">
                  {post.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex rounded-full border border-[color:color-mix(in_srgb,var(--outline-variant)_35%,transparent)] px-3 py-1.5 text-sm text-[var(--on-surface-variant)]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section aria-label="Detail hero preview" className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-6">
          <div className="flex flex-col gap-2">
            <p className={styles.metaText}>Blog detail hero</p>
            <h2 className="text-[1.5rem] tracking-[-0.04em] text-[var(--on-surface)] sm:text-[1.75rem]">
              How the thumbnail renders in a post hero
            </h2>
            <p className={styles.cardBody}>Full-width 21:9 thumbnail between the back link and the title/excerpt.</p>
          </div>

          <div className={`${styles.heroSurface} rounded-[2rem] border border-[color:color-mix(in_srgb,var(--outline-variant)_45%,transparent)] px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12`}>
            <span className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.14em] text-[var(--on-surface-variant)]">
              ← Back to all guides
            </span>

            <div className="mt-8 relative aspect-[21/9] overflow-hidden rounded-[1.2rem] border border-[color:color-mix(in_srgb,var(--brand-primary)_18%,var(--outline-variant)_82%)] bg-[linear-gradient(180deg,var(--surface-container-highest)_0%,var(--surface-container-lowest)_100%)]">
              <Image
                src={THUMB_BLUE}
                alt="Preview thumbnail"
                fill
                sizes="(max-width: 1280px) 100vw, 100rem"
                className="object-cover"
              />
            </div>

            <div className="mt-8 flex max-w-[58rem] flex-col gap-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`${styles.eyebrow} rounded-full px-3 py-2`}>Architecture</span>
                <span className="inline-flex rounded-full border border-[color:color-mix(in_srgb,var(--outline-variant)_35%,transparent)] px-3 py-1.5 text-sm text-[var(--on-surface-variant)]">
                  #ai
                </span>
              </div>
              <h2 className={`${styles.pageTitle} max-w-[14ch] text-[var(--on-surface)]`}>
                The Commoditization of Free Inference
              </h2>
              <p className={`${styles.proseLead} max-w-[44rem]`}>
                Free hosted models are reshaping how teams prototype and evaluate AI. Here is what the architecture looks like, where the business model breaks, and when you should still pay.
              </p>
            </div>

            <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-4 text-sm text-[var(--on-surface-variant)]">
              <div className="inline-flex items-center gap-2">
                <span>📅</span>
                <dd>31 May 2026</dd>
              </div>
              <div className="inline-flex items-center gap-2">
                <span>⏱️</span>
                <dd>12 min read</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section aria-label="No-thumbnail fallback preview" className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-6">
          <div className="flex flex-col gap-2">
            <p className={styles.metaText}>No-thumbnail fallback</p>
            <h2 className="text-[1.5rem] tracking-[-0.04em] text-[var(--on-surface)] sm:text-[1.75rem]">
              Detail hero without a thumbnail
            </h2>
            <p className={styles.cardBody}>When no thumbnail is uploaded, the hero gracefully omits the image block.</p>
          </div>

          <div className={`${styles.heroSurface} rounded-[2rem] border border-[color:color-mix(in_srgb,var(--outline-variant)_45%,transparent)] px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12`}>
            <span className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.14em] text-[var(--on-surface-variant)]">
              ← Back to all guides
            </span>

            <div className="mt-8 flex max-w-[58rem] flex-col gap-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`${styles.eyebrow} rounded-full px-3 py-2`}>Guide</span>
              </div>
              <h2 className={`${styles.pageTitle} max-w-[14ch] text-[var(--on-surface)]`}>
                Token Optimization for AI Coding Agents
              </h2>
              <p className={`${styles.proseLead} max-w-[44rem]`}>
                How RTK reduces token waste by 40 percent with smart shell output filtering and grouping.
              </p>
            </div>

            <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-4 text-sm text-[var(--on-surface-variant)]">
              <div className="inline-flex items-center gap-2">
                <span>📅</span>
                <dd>25 May 2026</dd>
              </div>
              <div className="inline-flex items-center gap-2">
                <span>⏱️</span>
                <dd>6 min read</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
    </MarketingPageFrame>
  );
}
