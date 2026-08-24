import { getServerSideSitemap } from 'next-sitemap';
import { getLegalDocument } from '@open-agency/cms-client';

import { getBlogSlugs } from '../blog/blog-data';
import { getSiteUrl } from '../../lib/site';

export const dynamic = 'force-dynamic';

export async function GET() {
  const siteUrl = getSiteUrl();
  const [postEntries, privacyDocument, termsDocument] = await Promise.all([
    getBlogSlugs(),
    getLegalDocument('privacy'),
    getLegalDocument('terms'),
  ]);
  const now = new Date().toISOString();
  const staticPaths = [
    '/',
    '/blog',
    '/tools',
    '/tools/local-model-calculator',
  ];

  return getServerSideSitemap([
    ...staticPaths.map((path) => ({
      loc: `${siteUrl}${path}`,
      lastmod: now,
    })),
    {
      loc: `${siteUrl}/privacy`,
      lastmod: privacyDocument?.updatedAt ?? now,
    },
    {
      loc: `${siteUrl}/terms`,
      lastmod: termsDocument?.updatedAt ?? now,
    },
    ...postEntries.map(({ slug }) => ({
      loc: `${siteUrl}/blog/${slug}`,
      lastmod: now,
    })),
  ]);
}
