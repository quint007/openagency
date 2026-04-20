// @vitest-environment node

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const { revalidatePathMock, revalidateTagMock } = vi.hoisted(() => ({
  revalidatePathMock: vi.fn(),
  revalidateTagMock: vi.fn(),
}));

const { validateRevalidateRequestMock } = vi.hoisted(() => ({
  validateRevalidateRequestMock: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: revalidatePathMock,
  revalidateTag: revalidateTagMock,
}));

vi.mock('@open-agency/cms-client', () => ({
  createRevalidateSuccessResponse: (body: { contentType: string; eventType: string }, invalidated: { paths: string[]; tags: string[] }) => ({
    contentType: body.contentType,
    eventType: body.eventType,
    invalidated,
    ok: true,
  }),
  createUnsupportedRevalidateResponse: (contentType: string) => ({
    error: {
      code: 'unsupported_payload',
      message: `This app does not support ${contentType} revalidation payloads.`,
    },
    ok: false,
  }),
  getAuthorSlugTag: (slug: string) => `author:slug:${slug}`,
  getBlogListTag: () => 'blog:list',
  getBlogSlugTag: (slug: string) => `blog:slug:${slug}`,
  validateRevalidateRequest: validateRevalidateRequestMock,
}));

const originalRevalidateSecret = process.env.REVALIDATE_SECRET;

async function loadRouteModule() {
  return import('../src/app/api/revalidate/route');
}

function createRequest(body: unknown, init?: RequestInit): Request {
  return new Request('http://localhost:3000/api/revalidate', {
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      'x-revalidate-secret': 'marketing-secret',
      ...init?.headers,
    },
    method: 'POST',
    ...init,
  });
}

beforeEach(() => {
  process.env.REVALIDATE_SECRET = 'marketing-secret';
  validateRevalidateRequestMock.mockReset();
});

afterEach(() => {
  vi.resetModules();
  revalidatePathMock.mockReset();
  revalidateTagMock.mockReset();

  if (originalRevalidateSecret === undefined) {
    delete process.env.REVALIDATE_SECRET;
  } else {
    process.env.REVALIDATE_SECRET = originalRevalidateSecret;
  }
});

describe('marketing /api/revalidate', () => {
  test('revalidates blog publish payloads with canonical tags and app root path', async () => {
    validateRevalidateRequestMock.mockResolvedValue({
      body: {
        contentType: 'blog-post',
        eventType: 'publish',
        slug: 'launch-week',
      },
      ok: true,
    });

    const { POST } = await loadRouteModule();
    const response = await POST(
      createRequest({
        contentType: 'blog-post',
        eventType: 'publish',
        slug: 'launch-week',
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      contentType: 'blog-post',
      eventType: 'publish',
      invalidated: {
        paths: ['/', '/blog', '/blog/launch-week', '/feed.xml', '/sitemap.xml'],
        tags: ['blog:list', 'blog:slug:launch-week'],
      },
      ok: true,
    });
    expect(revalidateTagMock).toHaveBeenCalledTimes(2);
    expect(revalidateTagMock).toHaveBeenNthCalledWith(1, 'blog:list', 'max');
    expect(revalidateTagMock).toHaveBeenNthCalledWith(2, 'blog:slug:launch-week', 'max');
    expect(revalidatePathMock).toHaveBeenCalledTimes(5);
    expect(revalidatePathMock).toHaveBeenNthCalledWith(1, '/', 'page');
    expect(revalidatePathMock).toHaveBeenNthCalledWith(2, '/blog', 'page');
    expect(revalidatePathMock).toHaveBeenNthCalledWith(3, '/blog/launch-week', 'page');
    expect(revalidatePathMock).toHaveBeenNthCalledWith(4, '/feed.xml', 'page');
    expect(revalidatePathMock).toHaveBeenNthCalledWith(5, '/sitemap.xml', 'page');
  });

  test('revalidates author delete payloads through POST', async () => {
    validateRevalidateRequestMock.mockResolvedValue({
      body: {
        contentType: 'author',
        eventType: 'delete',
        slug: 'jane-doe',
      },
      ok: true,
    });

    const { POST } = await loadRouteModule();
    const response = await POST(
      createRequest({
        contentType: 'author',
        eventType: 'delete',
        slug: 'jane-doe',
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      contentType: 'author',
      eventType: 'delete',
      invalidated: {
        paths: ['/'],
        tags: ['author:slug:jane-doe'],
      },
      ok: true,
    });
    expect(revalidateTagMock).toHaveBeenCalledTimes(1);
    expect(revalidateTagMock).toHaveBeenCalledWith('author:slug:jane-doe', 'max');
    expect(revalidatePathMock).toHaveBeenCalledWith('/', 'page');
  });

  test('revalidates both current and previous blog slugs for slug-change payloads', async () => {
    validateRevalidateRequestMock.mockResolvedValue({
      body: {
        contentType: 'blog-post',
        eventType: 'slug-change',
        previousSlug: 'launch-week',
        slug: 'launch-week-recap',
      },
      ok: true,
    });

    const { POST } = await loadRouteModule();
    const response = await POST(
      createRequest({
        contentType: 'blog-post',
        eventType: 'slug-change',
        previousSlug: 'launch-week',
        slug: 'launch-week-recap',
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      contentType: 'blog-post',
      eventType: 'slug-change',
      invalidated: {
        paths: ['/', '/blog', '/blog/launch-week-recap', '/feed.xml', '/sitemap.xml', '/blog/launch-week'],
        tags: ['blog:list', 'blog:slug:launch-week-recap', 'blog:slug:launch-week'],
      },
      ok: true,
    });
  });

  test('rejects invalid secrets', async () => {
    validateRevalidateRequestMock.mockResolvedValue({
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

    const { POST } = await loadRouteModule();
    const response = await POST(
      createRequest(
        {
          contentType: 'blog-post',
          eventType: 'publish',
          slug: 'launch-week',
        },
        {
          headers: {
            'content-type': 'application/json',
            'x-revalidate-secret': 'wrong-secret',
          },
        },
      ),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: 'invalid_secret',
        message: 'The revalidation secret is invalid.',
      },
      ok: false,
    });
    expect(revalidateTagMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  test('rejects non-POST methods with a deterministic json response', async () => {
    validateRevalidateRequestMock.mockResolvedValue({
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

    const { GET } = await loadRouteModule();
    const response = await GET(new Request('http://localhost:3000/api/revalidate', { method: 'GET' }));

    expect(response.status).toBe(405);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: 'invalid_method',
        message: 'Only POST requests are supported.',
      },
      ok: false,
    });
  });

  test('rejects payloads for content owned by the courses app', async () => {
    validateRevalidateRequestMock.mockResolvedValue({
      body: {
        contentType: 'course',
        eventType: 'publish',
        slug: 'intro-to-design-systems',
      },
      ok: true,
    });

    const { POST } = await loadRouteModule();
    const response = await POST(
      createRequest({
        contentType: 'course',
        eventType: 'publish',
        slug: 'intro-to-design-systems',
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: 'unsupported_payload',
        message: 'This app does not support course revalidation payloads.',
      },
      ok: false,
    });
    expect(revalidateTagMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});
