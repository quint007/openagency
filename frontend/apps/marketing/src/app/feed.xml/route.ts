import { getAllBlogCards } from '../blog/blog-data';
import { getSiteUrl } from '../../lib/site';

export const dynamic = 'force-dynamic';

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export async function GET() {
  const siteUrl = getSiteUrl();
  const posts = await getAllBlogCards();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Open Agency Blog</title>
    <link>${siteUrl}/blog</link>
    <description>Practical AI guides, templates, and workflow notes from Open Agency.</description>
    <language>en-us</language>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
    ${posts
      .map((post) => {
        const postUrl = `${siteUrl}${post.href}`;

        return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <description>${escapeXml(post.excerpt)}</description>
      <category>${escapeXml(post.category)}</category>
      ${post.publishedAtIso ? `<pubDate>${new Date(post.publishedAtIso).toUTCString()}</pubDate>` : ''}
    </item>`;
      })
      .join('')}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
}
