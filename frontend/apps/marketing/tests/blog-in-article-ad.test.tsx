import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

import { InArticleAd } from '../src/app/blog/[slug]/InArticleAd';

const { getCookieConsentMock, getCookieIntegrationConfigMock } = vi.hoisted(() => ({
  getCookieConsentMock: vi.fn(),
  getCookieIntegrationConfigMock: vi.fn(),
}));

vi.mock('../src/app/components/CookieConsent/context', () => ({
  useCookieConsent: () => getCookieConsentMock(),
}));

vi.mock('../src/app/components/CookieConsent/cookie-config', () => ({
  cookieIntegrationConfig: {
    get adsenseClientId() {
      return getCookieIntegrationConfigMock().adsenseClientId;
    },
  },
}));

afterEach(() => {
  vi.clearAllMocks();
  delete window.adsbygoogle;
});

test('renders the in-article ad and queues AdSense when ad consent is granted', async () => {
  getCookieConsentMock.mockReturnValue({
    consent: { ads: true },
    isHydrated: true,
  });
  getCookieIntegrationConfigMock.mockReturnValue({
    adsenseClientId: 'ca-pub-4790131778246365',
  });

  render(<InArticleAd />);

  const ad = document.querySelector('ins.adsbygoogle');

  expect(ad).not.toBeNull();
  expect(ad?.getAttribute('data-ad-layout')).toBe('in-article');
  expect(ad?.getAttribute('data-ad-format')).toBe('fluid');
  expect(ad?.getAttribute('data-ad-client')).toBe('ca-pub-4790131778246365');
  expect(ad?.getAttribute('data-ad-slot')).toBe('9258584472');
  expect(screen.getByText('Sponsored')).toBeTruthy();

  await waitFor(() => {
    expect(window.adsbygoogle).toEqual([{}]);
  });
});

test('does not render the in-article ad before consent hydration or without ad consent', () => {
  getCookieIntegrationConfigMock.mockReturnValue({
    adsenseClientId: 'ca-pub-4790131778246365',
  });

  getCookieConsentMock.mockReturnValue({
    consent: { ads: true },
    isHydrated: false,
  });
  const { rerender } = render(<InArticleAd />);

  expect(document.querySelector('ins.adsbygoogle')).toBeNull();
  expect(window.adsbygoogle).toBeUndefined();

  getCookieConsentMock.mockReturnValue({
    consent: { ads: false },
    isHydrated: true,
  });
  rerender(<InArticleAd />);

  expect(document.querySelector('ins.adsbygoogle')).toBeNull();
  expect(window.adsbygoogle).toBeUndefined();
});
