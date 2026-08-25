import { cookieIntegrationConfig } from "../components/CookieConsent/cookie-config";

export function GET() {
  const { adsensePublisherId, hasAds } = cookieIntegrationConfig;

  const adsTxtContent = hasAds
    ? `google.com, ${adsensePublisherId}, DIRECT, f08c47fec0942fa0\n`
    : "# No advertising partners configured.\n";

  return new Response(adsTxtContent, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
