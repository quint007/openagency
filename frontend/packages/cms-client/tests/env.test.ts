// @vitest-environment node

import { afterEach, describe, expect, test, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { getCmsServerEnv, getPayloadApiUrl, getRevalidateSecret } from '../src/index';

const originalPayloadApiUrl = process.env.PAYLOAD_API_URL;
const originalRevalidateSecret = process.env.REVALIDATE_SECRET;

afterEach(() => {
  if (originalPayloadApiUrl === undefined) {
    delete process.env.PAYLOAD_API_URL;
  } else {
    process.env.PAYLOAD_API_URL = originalPayloadApiUrl;
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
    process.env.REVALIDATE_SECRET = 'revalidate-secret';

    expect(getPayloadApiUrl()).toBe('http://localhost:3002/api');
    expect(getRevalidateSecret()).toBe('revalidate-secret');
    expect(getCmsServerEnv()).toEqual({
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
