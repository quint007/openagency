// @vitest-environment node

import { afterEach, describe, expect, expectTypeOf, test, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  getAuthor,
  getAuthorSlugTag,
  getBlogListTag,
  getBlogPost,
  getBlogPosts,
  getBlogSlugTag,
  getCourse,
  getCourseListTag,
  getCourseSlugTag,
  getCourses,
  getLesson,
  getLessonSlugTag,
  type Author,
  type BlogPost,
  type Course,
  type Lesson,
} from '../src/index';

const originalPayloadApiKey = process.env.PAYLOAD_API_KEY;
const originalPayloadApiUrl = process.env.PAYLOAD_API_URL;

function createJsonResponse(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
    },
    status: 200,
    ...init,
  });
}

function createCourse(slug = 'agentic-systems'): Course {
  return {
    id: 42,
    slug,
  } as Course;
}

function createBlogPost(slug = 'launch-week'): BlogPost {
  return {
    id: 3,
    slug,
  } as BlogPost;
}

function createAuthor(slug = 'jane-doe'): Author {
  return {
    id: 11,
    slug,
  } as Author;
}

function readFetchCall(): { init: RequestInit & { next?: { revalidate?: number; tags?: string[] } }; url: URL } {
  const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
  const [requestUrl, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit & { next?: { revalidate?: number; tags?: string[] } }];

  return {
    init: requestInit,
    url: new URL(requestUrl),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();

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
});

describe('cms-client typed Payload fetchers', () => {
  test('exposes generated Payload-backed TypeScript return types', () => {
    expectTypeOf<Awaited<ReturnType<typeof getCourse>>>().toEqualTypeOf<Course | null>();
    expectTypeOf<Awaited<ReturnType<typeof getCourses>>>().toEqualTypeOf<Course[]>();
    expectTypeOf<Awaited<ReturnType<typeof getLesson>>>().toEqualTypeOf<Lesson | null>();
    expectTypeOf<Awaited<ReturnType<typeof getBlogPost>>>().toEqualTypeOf<BlogPost | null>();
    expectTypeOf<Awaited<ReturnType<typeof getBlogPosts>>>().toEqualTypeOf<BlogPost[]>();
    expectTypeOf<Awaited<ReturnType<typeof getAuthor>>>().toEqualTypeOf<Author | null>();
  });

  test('builds the blog post request with the canonical ISR tag contract', async () => {
    process.env.PAYLOAD_API_URL = 'https://cms.example.com/api/';
    process.env.PAYLOAD_API_KEY = 'server-secret';

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createJsonResponse({ docs: [createBlogPost()] })));

    await expect(getBlogPost('launch-week')).resolves.toEqual(createBlogPost());

    const { init, url } = readFetchCall();

    expect(url.origin + url.pathname).toBe('https://cms.example.com/api/blog-posts');
    expect(url.searchParams.get('depth')).toBe('2');
    expect(url.searchParams.get('limit')).toBe('1');
    expect(url.searchParams.get('sort')).toBe('-publishedAt');
    expect(url.searchParams.get('where[_status][equals]')).toBe('published');
    expect(url.searchParams.get('where[slug][equals]')).toBe('launch-week');
    expect(init.method).toBe('GET');
    expect(init.headers).toEqual({
      Accept: 'application/json',
      Authorization: 'users API-Key server-secret',
    });
    expect(init.next).toEqual({
      revalidate: 3600,
      tags: [getBlogSlugTag('launch-week')],
    });
  });

  test('builds list requests with collection-specific cache tags', async () => {
    process.env.PAYLOAD_API_URL = 'https://cms.example.com/api';
    process.env.PAYLOAD_API_KEY = 'server-secret';

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createJsonResponse({ docs: [createBlogPost('hello-world')] }))
      .mockResolvedValueOnce(createJsonResponse({ docs: [createCourse('oa-foundations')] }));

    vi.stubGlobal('fetch', fetchMock);

    await expect(getBlogPosts()).resolves.toEqual([createBlogPost('hello-world')]);

    let request = readFetchCall();

    expect(request.url.pathname).toBe('/api/blog-posts');
    expect(request.url.searchParams.get('sort')).toBe('-publishedAt');
    expect(request.init.next).toEqual({
      revalidate: 3600,
      tags: [getBlogListTag()],
    });

    await expect(getCourses()).resolves.toEqual([createCourse('oa-foundations')]);

    request = {
      init: fetchMock.mock.calls[1][1] as RequestInit & { next?: { revalidate?: number; tags?: string[] } },
      url: new URL(fetchMock.mock.calls[1][0] as string),
    };

    expect(request.url.pathname).toBe('/api/courses');
    expect(request.url.searchParams.get('sort')).toBe('title');
    expect(request.url.searchParams.get('where[_status][equals]')).toBe('published');
    expect(request.url.searchParams.get('where[status][equals]')).toBe('published');
    expect(request.init.next).toEqual({
      tags: [getCourseListTag()],
    });
    expect(request.init.next?.revalidate).toBeUndefined();
  });

  test('uses real lesson and author collection slugs and returns null for misses', async () => {
    process.env.PAYLOAD_API_URL = 'https://cms.example.com/api';
    process.env.PAYLOAD_API_KEY = 'server-secret';

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createJsonResponse({ docs: [] }))
      .mockResolvedValueOnce(createJsonResponse({ docs: [createAuthor()] }));

    vi.stubGlobal('fetch', fetchMock);

    await expect(getLesson('intro-to-prompts')).resolves.toBeNull();

    let request = readFetchCall();

    expect(request.url.pathname).toBe('/api/lessons');
    expect(request.url.searchParams.get('where[slug][equals]')).toBe('intro-to-prompts');
    expect(request.url.searchParams.get('where[_status][equals]')).toBe('published');
    expect(request.url.searchParams.get('where[status][equals]')).toBe('published');
    expect(request.init.next).toEqual({
      tags: [getLessonSlugTag('intro-to-prompts')],
    });

    await expect(getAuthor('jane-doe')).resolves.toEqual(createAuthor());

    request = {
      init: fetchMock.mock.calls[1][1] as RequestInit & { next?: { revalidate?: number; tags?: string[] } },
      url: new URL(fetchMock.mock.calls[1][0] as string),
    };

    expect(request.url.pathname).toBe('/api/authors');
    expect(request.url.searchParams.get('sort')).toBe('name');
    expect(request.url.searchParams.get('where[slug][equals]')).toBe('jane-doe');
    expect(request.url.searchParams.has('where[status][equals]')).toBe(false);
    expect(request.init.next).toEqual({
      tags: [getAuthorSlugTag('jane-doe')],
    });
  });

  test('fails safely when Payload returns a malformed list response', async () => {
    process.env.PAYLOAD_API_URL = 'https://cms.example.com/api';
    process.env.PAYLOAD_API_KEY = 'server-secret';

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createJsonResponse({ totalDocs: 1 })));

    await expect(getBlogPosts()).rejects.toThrow(
      '@open-agency/cms-client received a malformed blog posts response.',
    );
  });

  test('fails safely when a fetched document is missing required identifiers', async () => {
    process.env.PAYLOAD_API_URL = 'https://cms.example.com/api';
    process.env.PAYLOAD_API_KEY = 'server-secret';

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createJsonResponse({ docs: [{ title: 'Broken course' }] })));

    await expect(getCourse('broken-course')).rejects.toThrow(
      '@open-agency/cms-client received a course document without the required id and slug.',
    );
  });

  test('rejects blank slugs in tag helpers and detail fetchers', async () => {
    process.env.PAYLOAD_API_URL = 'https://cms.example.com/api';
    process.env.PAYLOAD_API_KEY = 'server-secret';

    expect(() => getCourseSlugTag('   ')).toThrow(
      '@open-agency/cms-client requires a non-empty course slug.',
    );

    await expect(getCourse('   ')).rejects.toThrow(
      '@open-agency/cms-client requires a non-empty course slug.',
    );
  });
});
