// @vitest-environment node

import { afterEach, describe, expect, test, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { getCmsServerEnv, getPayloadApiUrl, getRevalidateSecret } from '../src/index';

const originalPayloadApiKey = process.env.PAYLOAD_API_KEY;
const originalPayloadApiUrl = process.env.PAYLOAD_API_URL;
const originalRevalidateSecret = process.env.REVALIDATE_SECRET;

afterEach(() => {
  if (originalPayloadApiUrl === undefined) {
    delete process.env.PAYLOAD_API_URL;
  } else {
    process.env.PAYLOAD_API_URL = originalPayloadApiUrl;
  }

  if (originalPayloadApiKey === undefined) {
    delete process.env.PAYLOAD_API_KEY;
  } else {
    process.env.PAYLOAD_API_KEY = originalPayloadApiKey;
  }

  if (originalRevalidateSecret === undefined) {
    delete process.env.REVALIDATE_SECRET;
  } else {
    process.env.REVALIDATE_SECRET = originalRevalidateSecret;
  }
});

describe('cms-client server env helpers', () => {
  test('reads the server-only Payload env vars', () => {
    process.env.PAYLOAD_API_URL = 'http://localhost:3002/api/';
    process.env.PAYLOAD_API_KEY = 'server-secret';
    process.env.REVALIDATE_SECRET = 'revalidate-secret';

    expect(getPayloadApiUrl()).toBe('http://localhost:3002/api');
    expect(getRevalidateSecret()).toBe('revalidate-secret');
    expect(getCmsServerEnv()).toEqual({
      apiKey: 'server-secret',
      apiUrl: 'http://localhost:3002/api',
      revalidateSecret: 'revalidate-secret',
    });
  });

  test('does not require PAYLOAD_API_KEY to be set', () => {
    process.env.PAYLOAD_API_URL = 'http://localhost:3002/api';
    delete process.env.PAYLOAD_API_KEY;
    process.env.REVALIDATE_SECRET = 'revalidate-secret';

    expect(getCmsServerEnv()).toEqual({
      apiKey: undefined,
      apiUrl: 'http://localhost:3002/api',
      revalidateSecret: 'revalidate-secret',
    });
  });

  test('throws when PAYLOAD_API_URL is missing', () => {
    delete process.env.PAYLOAD_API_URL;

    expect(() => getPayloadApiUrl()).toThrow(
      '@open-agency/cms-client requires PAYLOAD_API_URL to be set in the server runtime.',
    );
  });

  test('throws when REVALIDATE_SECRET is missing', () => {
    delete process.env.REVALIDATE_SECRET;

    expect(() => getRevalidateSecret()).toThrow(
      '@open-agency/cms-client requires REVALIDATE_SECRET to be set in the server runtime.',
    );
  });
});
