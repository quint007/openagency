export type CookieIntegrationEnvironment = {
  readonly NEXT_PUBLIC_ADSENSE_CLIENT_ID?: string;
  readonly NEXT_PUBLIC_GA_ID?: string;
};

export type CookieIntegrationConfig = {
  readonly adsenseClientId: string;
  readonly adsensePublisherId: string;
  readonly googleAnalyticsId: string;
  readonly hasAds: boolean;
  readonly hasAnalytics: boolean;
  readonly hasOptionalIntegrations: boolean;
};

export function extractAdsensePublisherId(clientId: string): string {
  if (!clientId.startsWith("ca-")) {
    return clientId;
  }

  return clientId.slice(3);
}

export function getCookieIntegrationConfig(
  environment: CookieIntegrationEnvironment,
): CookieIntegrationConfig {
  const googleAnalyticsId = environment.NEXT_PUBLIC_GA_ID?.trim() ?? "";
  const adsenseClientId = environment.NEXT_PUBLIC_ADSENSE_CLIENT_ID?.trim() ?? "";
  const adsensePublisherId = extractAdsensePublisherId(adsenseClientId);
  const hasAnalytics = googleAnalyticsId.length > 0;
  const hasAds = adsenseClientId.length > 0;

  return {
    adsenseClientId,
    adsensePublisherId,
    googleAnalyticsId,
    hasAds,
    hasAnalytics,
    hasOptionalIntegrations: hasAnalytics || hasAds,
  };
}

export const cookieIntegrationConfig = getCookieIntegrationConfig({
  NEXT_PUBLIC_ADSENSE_CLIENT_ID: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID,
  NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
});
