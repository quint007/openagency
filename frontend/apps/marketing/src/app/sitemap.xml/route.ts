import { getServerSideSitemap } from 'next-sitemap';

import { getBlogSlugs } from '../blog/blog-data';
import { getSiteUrl } from '../../lib/site';

export const dynamic = 'force-dynamic';

export async function GET() {
  const siteUrl = getSiteUrl();
  const postEntries = await getBlogSlugs();
  const now = new Date().toISOString();

  return getServerSideSitemap([
    {
      loc: `${siteUrl}/`,
      lastmod: now,
    },
    {
      loc: `${siteUrl}/blog`,
      lastmod: now,
    },
    ...postEntries.map(({ slug }) => ({
      loc: `${siteUrl}/blog/${slug}`,
      lastmod: now,
    })),
  ]);
}
