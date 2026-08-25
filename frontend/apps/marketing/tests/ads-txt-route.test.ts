// @vitest-environment node

import { afterEach, expect, test, vi } from 'vitest';

import { GET } from '../src/app/ads.txt/route';

const { getCookieIntegrationConfigMock } = vi.hoisted(() => ({
  getCookieIntegrationConfigMock: vi.fn(),
}));

vi.mock('../src/app/components/CookieConsent/cookie-config', () => ({
  cookieIntegrationConfig: {
    get adsensePublisherId() {
      return getCookieIntegrationConfigMock().adsensePublisherId;
    },
    get hasAds() {
      return getCookieIntegrationConfigMock().hasAds;
    },
  },
}));

afterEach(() => {
  vi.clearAllMocks();
});

test('ads.txt returns AdSense publisher line when advertising is configured', async () => {
  getCookieIntegrationConfigMock.mockReturnValue({
    adsensePublisherId: 'pub-1234567890',
    hasAds: true,
  });

  const response = await GET();
  const text = await response.text();

  expect(response.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
  expect(text).toBe('google.com, pub-1234567890, DIRECT, f08c47fec0942fa0\n');
});

test('ads.txt returns a comment when advertising is not configured', async () => {
  getCookieIntegrationConfigMock.mockReturnValue({
    adsensePublisherId: '',
    hasAds: false,
  });

  const response = await GET();
  const text = await response.text();

  expect(response.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
  expect(text).toBe('# No advertising partners configured.\n');
});
