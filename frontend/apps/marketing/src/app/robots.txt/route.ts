import { getSiteUrl } from "../../lib/site";

export function GET() {
  const siteUrl = getSiteUrl();

  return new Response(`User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
