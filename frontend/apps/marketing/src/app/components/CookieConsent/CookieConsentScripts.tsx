"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { cookieIntegrationConfig } from "./cookie-config";
import { useCookieConsent } from "./context";

function getGoogleAnalyticsInitialization(analyticsId: string) {
  return `
    window.dataLayer = window.dataLayer || [];
    function gtag(){window.dataLayer.push(arguments);}
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', ${JSON.stringify(analyticsId)});
  `;
}

function AdSenseScript({ clientId }: { readonly clientId: string }) {
  useEffect(() => {
    if (document.getElementById("google-adsense-script")) {
      return;
    }

    const script = document.createElement("script");
    script.id = "google-adsense-script";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
    document.head.append(script);
  }, [clientId]);

  return null;
}

export function CookieConsentScripts() {
  const { consent, isHydrated } = useCookieConsent();
  const { adsenseClientId, googleAnalyticsId } = cookieIntegrationConfig;
  const pathname = usePathname();
  const isCredentialRoute = pathname === "/newsletter/confirm" || pathname === "/newsletter/unsubscribe";

  if (!isHydrated || isCredentialRoute) {
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
        <AdSenseScript clientId={adsenseClientId} />
      ) : null}
    </>
  );
}
