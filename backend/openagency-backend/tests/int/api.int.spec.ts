import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { BlogPosts } from '@/collections/BlogPosts'
import { Lessons } from '@/collections/Lessons'
import { deliverRevalidationRequest } from '@/hooks/revalidateContent'

const originalEnv = {
  COURSES_APP_BASE_URL: process.env.COURSES_APP_BASE_URL,
  COURSES_REVALIDATE_URL: process.env.COURSES_REVALIDATE_URL,
  MARKETING_APP_BASE_URL: process.env.MARKETING_APP_BASE_URL,
  MARKETING_REVALIDATE_URL: process.env.MARKETING_REVALIDATE_URL,
  REVALIDATE_SECRET: process.env.REVALIDATE_SECRET,
  REVALIDATE_TIMEOUT_MS: process.env.REVALIDATE_TIMEOUT_MS,
}

function createLogger() {
  return {
    error: vi.fn(),
    info: vi.fn(),
  }
}

function createRequest(logger = createLogger()) {
  return {
    context: {},
    payload: {
      logger,
    },
  }
}

describe('backend revalidation delivery', () => {
  beforeEach(() => {
    process.env.MARKETING_APP_BASE_URL = 'http://marketing.test'
    process.env.COURSES_APP_BASE_URL = 'http://courses.test'
    delete process.env.MARKETING_REVALIDATE_URL
    delete process.env.COURSES_REVALIDATE_URL
    process.env.REVALIDATE_SECRET = 'shared-secret'
    delete process.env.REVALIDATE_TIMEOUT_MS
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    vi.useRealTimers()

    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
  })

  it('posts signed publish payloads for wired blog post hooks', async () => {
    const logger = createLogger()
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        headers: {
          'content-type': 'application/json',
        },
        status: 200,
      }),
    )

    vi.stubGlobal('fetch', fetchMock)

    const hook = BlogPosts.hooks?.afterChange?.[0]

    await expect(
      hook?.({
        doc: {
          _status: 'published',
          id: 'blog-post-1',
          slug: 'launch-week',
        },
        previousDoc: {
          _status: 'draft',
          id: 'blog-post-1',
          slug: 'launch-week',
        },
        req: createRequest(logger),
      } as never),
    ).resolves.toMatchObject({
      _status: 'published',
      id: 'blog-post-1',
      slug: 'launch-week',
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]

    expect(url).toBe('http://marketing.test/api/revalidate')
    expect(init.method).toBe('POST')
    expect(init.headers).toMatchObject({
      'content-type': 'application/json',
      'x-revalidate-secret': 'shared-secret',
    })
    expect(JSON.parse(String(init.body))).toEqual({
      contentType: 'blog-post',
      eventType: 'publish',
      previousSlug: undefined,
      slug: 'launch-week',
    })
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('surfaces non-2xx delivery failures from wired lesson delete hooks', async () => {
    const logger = createLogger()
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: false }), {
        headers: {
          'content-type': 'application/json',
        },
        status: 502,
        statusText: 'Bad Gateway',
      }),
    )

    vi.stubGlobal('fetch', fetchMock)

    const hook = Lessons.hooks?.afterDelete?.[0]

    await expect(
      hook?.({
        doc: {
          _status: 'published',
          id: 'lesson-0',
          slug: 'lesson-zero',
        },
        req: createRequest(logger),
      } as never),
    ).rejects.toThrow('Revalidation delivery failed with 502 Bad Gateway: {"ok":false}')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(logger.error).toHaveBeenCalledWith(
      'Revalidation delivery failed with 502 Bad Gateway: {"ok":false}',
    )
  })

  it('prefers dedicated revalidation URLs over public app URLs when provided', async () => {
    const logger = createLogger()
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        headers: {
          'content-type': 'application/json',
        },
        status: 200,
      }),
    )

    process.env.MARKETING_REVALIDATE_URL = 'https://marketing-origin.internal'

    vi.stubGlobal('fetch', fetchMock)

    await expect(
      deliverRevalidationRequest({
        collection: 'blog-posts',
        eventType: 'publish',
        logger,
        slug: 'launch-week',
      }),
    ).resolves.toBeUndefined()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://marketing-origin.internal/api/revalidate')
  })

  it('times out deterministically when the frontend app does not respond', async () => {
    const logger = createLogger()

    process.env.REVALIDATE_TIMEOUT_MS = '10'
    vi.useFakeTimers()

    const fetchMock = vi.fn().mockImplementation(
      (_url: string, init?: RequestInit) =>
        new Promise((_, reject) => {
          ;(init?.signal as AbortSignal | undefined)?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'))
          })
        }),
    )

    vi.stubGlobal('fetch', fetchMock)

    const deliveryPromise = deliverRevalidationRequest({
      collection: 'courses',
      eventType: 'publish',
      logger,
      slug: 'intro-to-design-systems',
    })
    const rejection = expect(deliveryPromise).rejects.toThrow(
      'Revalidation delivery timed out after 10ms.',
    )

    await vi.advanceTimersByTimeAsync(10)

    await rejection
    expect(logger.error).toHaveBeenCalledWith('Revalidation delivery timed out after 10ms.')
  })
})
