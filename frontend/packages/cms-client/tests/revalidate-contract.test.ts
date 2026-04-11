// @vitest-environment node

import { afterEach, describe, expect, test, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  REVALIDATE_SECRET_HEADER,
  createRevalidateSuccessResponse,
  validateRevalidateRequest,
} from '../src/index';

const originalRevalidateSecret = process.env.REVALIDATE_SECRET;

function createRequest(body: unknown, init?: RequestInit): Request {
  return new Request('http://localhost/api/revalidate', {
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      [REVALIDATE_SECRET_HEADER]: 'shared-secret',
      ...init?.headers,
    },
    method: 'POST',
    ...init,
  });
}

afterEach(() => {
  if (originalRevalidateSecret === undefined) {
    delete process.env.REVALIDATE_SECRET;
  } else {
    process.env.REVALIDATE_SECRET = originalRevalidateSecret;
  }
});

describe('cms-client revalidate contract', () => {
  test('accepts valid signed json requests', async () => {
    process.env.REVALIDATE_SECRET = 'shared-secret';

    await expect(
      validateRevalidateRequest(
        createRequest({
          contentType: 'course',
          eventType: 'publish',
          slug: 'intro-to-design-systems',
        }),
      ),
    ).resolves.toEqual({
      body: {
        contentType: 'course',
        eventType: 'publish',
        previousSlug: undefined,
        slug: 'intro-to-design-systems',
      },
      ok: true,
    });
  });

  test('rejects invalid methods before parsing the payload', async () => {
    process.env.REVALIDATE_SECRET = 'shared-secret';

    await expect(
      validateRevalidateRequest(
        new Request('http://localhost/api/revalidate', {
          method: 'GET',
        }),
      ),
    ).resolves.toEqual({
      ok: false,
      response: {
        error: {
          code: 'invalid_method',
          message: 'Only POST requests are supported.',
        },
        ok: false,
      },
      status: 405,
    });
  });

  test('rejects invalid secrets', async () => {
    process.env.REVALIDATE_SECRET = 'shared-secret';

    await expect(
      validateRevalidateRequest(
        createRequest(
          {
            contentType: 'blog-post',
            eventType: 'publish',
            slug: 'launch-week',
          },
          {
            headers: {
              'content-type': 'application/json',
              [REVALIDATE_SECRET_HEADER]: 'wrong-secret',
            },
          },
        ),
      ),
    ).resolves.toEqual({
      ok: false,
      response: {
        error: {
          code: 'invalid_secret',
          message: 'The revalidation secret is invalid.',
        },
        ok: false,
      },
      status: 401,
    });
  });

  test('rejects non-json requests', async () => {
    process.env.REVALIDATE_SECRET = 'shared-secret';

    await expect(
      validateRevalidateRequest(
        createRequest(
          {
            contentType: 'blog-post',
            eventType: 'publish',
            slug: 'launch-week',
          },
          {
            headers: {
              'content-type': 'text/plain',
              [REVALIDATE_SECRET_HEADER]: 'shared-secret',
            },
          },
        ),
      ),
    ).resolves.toEqual({
      ok: false,
      response: {
        error: {
          code: 'invalid_content_type',
          message: 'Content-Type must be application/json.',
        },
        ok: false,
      },
      status: 400,
    });
  });

  test('rejects slug-change payloads without previousSlug', async () => {
    process.env.REVALIDATE_SECRET = 'shared-secret';

    await expect(
      validateRevalidateRequest(
        createRequest({
          contentType: 'course',
          eventType: 'slug-change',
          slug: 'design-systems-bootcamp',
        }),
      ),
    ).resolves.toEqual({
      ok: false,
      response: {
        error: {
          code: 'invalid_payload',
          message: 'previousSlug is required for slug-change events.',
        },
        ok: false,
      },
      status: 400,
    });
  });

  test('deduplicates invalidated tags and paths in success responses', () => {
    expect(
      createRevalidateSuccessResponse(
        {
          contentType: 'course',
          eventType: 'publish',
          slug: 'intro-to-design-systems',
        },
        {
          paths: ['/', '/'],
          tags: ['course:list', 'course:list', 'course:slug:intro-to-design-systems'],
        },
      ),
    ).toEqual({
      contentType: 'course',
      eventType: 'publish',
      invalidated: {
        paths: ['/'],
        tags: ['course:list', 'course:slug:intro-to-design-systems'],
      },
      ok: true,
    });
  });
});
