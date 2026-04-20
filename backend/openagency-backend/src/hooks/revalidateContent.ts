import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

const REVALIDATE_SECRET_HEADER = 'x-revalidate-secret'
const REVALIDATE_PATH = '/api/revalidate'
const DEFAULT_REVALIDATE_TIMEOUT_MS = 5000
const REVALIDATE_ENDPOINT_ENV_BY_APP = {
  courses: 'COURSES_REVALIDATE_URL',
  marketing: 'MARKETING_REVALIDATE_URL',
} as const
const PUBLIC_BASE_URL_ENV_BY_APP = {
  courses: 'COURSES_APP_BASE_URL',
  marketing: 'MARKETING_APP_BASE_URL',
} as const

type RevalidateCollectionSlug = 'authors' | 'blog-posts' | 'courses' | 'lessons'
type RevalidateApp = 'courses' | 'marketing'
type RevalidateContentType = 'author' | 'blog-post' | 'course' | 'lesson'
type RevalidateEventType = 'delete' | 'publish' | 'slug-change' | 'unpublish'
type RevalidateDocument = {
  _status?: 'draft' | 'published' | null
  id: number | string
  slug?: null | string
}
type RevalidateLogger = {
  error: (message: string) => void
  info: (message: string) => void
}
type RevalidateDeliveryRequest = {
  collection: RevalidateCollectionSlug
  eventType: RevalidateEventType
  logger: RevalidateLogger
  previousSlug?: string
  slug: string
}
type RevalidateDeliveryPayload = {
  contentType: RevalidateContentType
  eventType: RevalidateEventType
  previousSlug?: string
  slug: string
}
type RevalidateTarget = {
  app: RevalidateApp
  contentType: RevalidateContentType
}

const revalidateTargets: Record<RevalidateCollectionSlug, RevalidateTarget> = {
  authors: {
    app: 'marketing',
    contentType: 'author',
  },
  'blog-posts': {
    app: 'marketing',
    contentType: 'blog-post',
  },
  courses: {
    app: 'courses',
    contentType: 'course',
  },
  lessons: {
    app: 'courses',
    contentType: 'lesson',
  },
}

export class RevalidationDeliveryError extends Error {
  code: 'configuration' | 'http_error' | 'network_error' | 'timeout'
  endpoint: string
  eventType: RevalidateEventType
  status?: number

  constructor(args: {
    cause?: unknown
    code: 'configuration' | 'http_error' | 'network_error' | 'timeout'
    endpoint: string
    eventType: RevalidateEventType
    message: string
    status?: number
  }) {
    super(args.message, args.cause ? { cause: args.cause } : undefined)
    this.name = 'RevalidationDeliveryError'
    this.code = args.code
    this.endpoint = args.endpoint
    this.eventType = args.eventType
    this.status = args.status
  }
}

export async function deliverRevalidationRequest(
  args: RevalidateDeliveryRequest,
  fetchImpl: typeof fetch = globalThis.fetch,
): Promise<void> {
  const target = revalidateTargets[args.collection]
  const endpoint = getRevalidateEndpoint(target.app)
  const payload = createRevalidatePayload({
    contentType: target.contentType,
    eventType: args.eventType,
    previousSlug: args.previousSlug,
    slug: args.slug,
  })
  const timeoutMs = getRevalidateTimeoutMs()
  const controller = new AbortController()
  const timeoutId = globalThis.setTimeout(() => {
    controller.abort(new DOMException('The operation was aborted.', 'AbortError'))
  }, timeoutMs)

  args.logger.info(
    `Sending ${args.eventType} revalidation for ${args.collection} to ${endpoint} with slug ${payload.slug}`,
  )

  try {
    const response = await fetchImpl(endpoint, {
      body: JSON.stringify(payload),
      headers: {
        'content-type': 'application/json',
        [REVALIDATE_SECRET_HEADER]: readRequiredEnv('REVALIDATE_SECRET'),
      },
      method: 'POST',
      signal: controller.signal,
    })

    if (!response.ok) {
      const responseText = await readResponseText(response)
      throw new RevalidationDeliveryError({
        code: 'http_error',
        endpoint,
        eventType: args.eventType,
        message: `Revalidation delivery failed with ${response.status} ${response.statusText || 'response error'}${responseText ? `: ${responseText}` : ''}`,
        status: response.status,
      })
    }

    args.logger.info(
      `Delivered ${args.eventType} revalidation for ${args.collection} to ${endpoint} with status ${response.status}`,
    )
  } catch (error) {
    const deliveryError =
      error instanceof RevalidationDeliveryError
        ? error
        : createUnexpectedDeliveryError({ endpoint, error, eventType: args.eventType, timeoutMs })

    args.logger.error(deliveryError.message)
    throw deliveryError
  } finally {
    globalThis.clearTimeout(timeoutId)
  }
}

export function createRevalidateAfterChangeHook<TDocument extends RevalidateDocument>(
  collection: RevalidateCollectionSlug,
): CollectionAfterChangeHook<TDocument> {
  return async ({ doc, previousDoc, req: { context, payload } }) => {
    if (context.disableRevalidate) {
      return doc
    }

    const event = getRevalidateEvent(doc, previousDoc)

    if (!event) {
      return doc
    }

    await deliverRevalidationRequest({
      collection,
      eventType: event.eventType,
      logger: payload.logger,
      previousSlug: event.previousSlug,
      slug: event.slug,
    })

    return doc
  }
}

export function createRevalidateAfterDeleteHook<TDocument extends RevalidateDocument>(
  collection: RevalidateCollectionSlug,
): CollectionAfterDeleteHook<TDocument> {
  return async ({ doc, req: { context, payload } }) => {
    if (context.disableRevalidate || !isPublished(doc)) {
      return doc
    }

    await deliverRevalidationRequest({
      collection,
      eventType: 'delete',
      logger: payload.logger,
      slug: readRequiredSlug(normalizeSlug(doc?.slug), `${collection} delete hook`),
    })

    return doc
  }
}

function createRevalidatePayload(args: {
  contentType: RevalidateContentType
  eventType: RevalidateEventType
  previousSlug?: string
  slug: string
}): RevalidateDeliveryPayload {
  return {
    contentType: args.contentType,
    eventType: args.eventType,
    previousSlug: args.previousSlug ? readRequiredSlug(args.previousSlug, 'previous slug') : undefined,
    slug: readRequiredSlug(args.slug, 'slug'),
  }
}

function createUnexpectedDeliveryError(args: {
  endpoint: string
  error: unknown
  eventType: RevalidateEventType
  timeoutMs: number
}): RevalidationDeliveryError {
  if (isAbortError(args.error)) {
    return new RevalidationDeliveryError({
      cause: args.error,
      code: 'timeout',
      endpoint: args.endpoint,
      eventType: args.eventType,
      message: `Revalidation delivery timed out after ${args.timeoutMs}ms.`,
    })
  }

  return new RevalidationDeliveryError({
    cause: args.error,
    code: 'network_error',
    endpoint: args.endpoint,
    eventType: args.eventType,
    message: `Revalidation delivery failed before a response was received: ${getErrorMessage(args.error)}`,
  })
}

function getRevalidateEndpoint(app: RevalidateApp): string {
  const revalidateUrl = readOptionalEnv(REVALIDATE_ENDPOINT_ENV_BY_APP[app])

  if (revalidateUrl) {
    return new URL(REVALIDATE_PATH, `${normalizeBaseUrl(revalidateUrl)}/`).toString()
  }

  const baseUrl = readRequiredEnv(PUBLIC_BASE_URL_ENV_BY_APP[app])

  return new URL(REVALIDATE_PATH, `${normalizeBaseUrl(baseUrl)}/`).toString()
}

function getRevalidateEvent(doc: RevalidateDocument, previousDoc?: RevalidateDocument): {
  eventType: RevalidateEventType
  previousSlug?: string
  slug: string
} | null {
  const currentPublished = isPublished(doc)
  const previousPublished = isPublished(previousDoc)
  const currentSlug = normalizeSlug(doc.slug)
  const previousSlug = normalizeSlug(previousDoc?.slug)

  if (currentPublished) {
    if (previousPublished && previousSlug && currentSlug !== previousSlug) {
      return {
        eventType: 'slug-change',
        previousSlug,
        slug: readRequiredSlug(currentSlug, 'current slug'),
      }
    }

    return {
      eventType: 'publish',
      slug: readRequiredSlug(currentSlug, 'current slug'),
    }
  }

  if (previousPublished) {
    return {
      eventType: 'unpublish',
      slug: readRequiredSlug(previousSlug, 'previous slug'),
    }
  }

  return null
}

function getRevalidateTimeoutMs(): number {
  const rawValue = process.env.REVALIDATE_TIMEOUT_MS?.trim()

  if (!rawValue) {
    return DEFAULT_REVALIDATE_TIMEOUT_MS
  }

  const timeoutMs = Number.parseInt(rawValue, 10)

  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new RevalidationDeliveryError({
      code: 'configuration',
      endpoint: 'env:REVALIDATE_TIMEOUT_MS',
      eventType: 'publish',
      message: 'REVALIDATE_TIMEOUT_MS must be a positive integer when set.',
    })
  }

  return timeoutMs
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'unknown error'
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === 'AbortError'
    : error instanceof Error && error.name === 'AbortError'
}

function isPublished(doc?: RevalidateDocument | null): boolean {
  return doc?._status === 'published'
}

async function readResponseText(response: Response): Promise<string> {
  try {
    return (await response.text()).trim()
  } catch {
    return ''
  }
}

function normalizeBaseUrl(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

function readOptionalEnv(
  name: 'COURSES_REVALIDATE_URL' | 'MARKETING_REVALIDATE_URL',
): string | undefined {
  const value = process.env[name]?.trim()

  return value ? value : undefined
}

function normalizeSlug(value?: null | string): string {
  return typeof value === 'string' ? value.trim() : ''
}

function readRequiredEnv(
  name:
    | 'COURSES_APP_BASE_URL'
    | 'COURSES_REVALIDATE_URL'
    | 'MARKETING_APP_BASE_URL'
    | 'MARKETING_REVALIDATE_URL'
    | 'REVALIDATE_SECRET',
): string {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new RevalidationDeliveryError({
      code: 'configuration',
      endpoint: `env:${name}`,
      eventType: 'publish',
      message: `${name} must be set for backend revalidation delivery.`,
    })
  }

  return value
}

function readRequiredSlug(value: string, context: string): string {
  const normalizedValue = value.trim()

  if (!normalizedValue) {
    throw new RevalidationDeliveryError({
      code: 'configuration',
      endpoint: `slug:${context}`,
      eventType: 'publish',
      message: `Missing slug value for ${context}.`,
    })
  }

  return normalizedValue
}
