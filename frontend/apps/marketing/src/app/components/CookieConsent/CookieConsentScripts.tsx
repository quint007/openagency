"use client";

import Script from "next/script";

import { useCookieConsent } from "./context";

const googleAnalyticsId = process.env.NEXT_PUBLIC_GA_ID?.trim() ?? "";
const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID?.trim() ?? "";

function getGoogleAnalyticsInitialization(analyticsId: string) {
  return `
    window.dataLayer = window.dataLayer || [];
    function gtag(){window.dataLayer.push(arguments);}
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', ${JSON.stringify(analyticsId)});
  `;
}

export function CookieConsentScripts() {
  const { consent, isHydrated } = useCookieConsent();

  if (!isHydrated) {
    return null;
  }

  return (
    <>
      {consent.analytics && googleAnalyticsId ? (
        <>
          <Script id="google-analytics-init" strategy="afterInteractive">
            {getGoogleAnalyticsInitialization(googleAnalyticsId)}
          </Script>
          <Script
            id="google-analytics-script"
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleAnalyticsId)}`}
            strategy="afterInteractive"
          />
        </>
      ) : null}

      {consent.ads && adsenseClientId ? (
        <Script
          id="google-adsense-script"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adsenseClientId)}`}
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
      ) : null}
    </>
  );
}
