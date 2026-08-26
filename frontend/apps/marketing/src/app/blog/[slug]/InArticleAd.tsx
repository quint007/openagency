'use client';

import { useEffect } from 'react';

import { cookieIntegrationConfig } from '../../components/CookieConsent/cookie-config';
import { useCookieConsent } from '../../components/CookieConsent/context';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const IN_ARTICLE_AD_SLOT = '9258584472';

export function InArticleAd() {
  const { consent, isHydrated } = useCookieConsent();

  useEffect(() => {
    if (!isHydrated || !consent.ads || !cookieIntegrationConfig.adsenseClientId) {
      return;
    }

    window.adsbygoogle = window.adsbygoogle || [];
    window.adsbygoogle.push({});
  }, [consent.ads, isHydrated]);

  if (!isHydrated || !consent.ads || !cookieIntegrationConfig.adsenseClientId) {
    return null;
  }

  return (
    <div className="flex w-full max-w-[46rem] flex-col gap-3 rounded-[1.5rem] border border-[color:color-mix(in_srgb,var(--outline-variant)_35%,transparent)] bg-[color:color-mix(in_srgb,var(--surface-container-lowest)_92%,transparent)] px-4 py-4 sm:px-5">
      <p className="text-[0.72rem] uppercase tracking-[0.18em] text-[var(--on-surface-variant)]">Sponsored</p>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', textAlign: 'center' }}
        data-ad-client={cookieIntegrationConfig.adsenseClientId}
        data-ad-format="fluid"
        data-ad-layout="in-article"
        data-ad-slot={IN_ARTICLE_AD_SLOT}
      />
    </div>
  );
}
