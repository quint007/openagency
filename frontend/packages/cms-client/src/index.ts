import 'server-only';

import type { Config } from '../../../../backend/openagency-backend/src/public-cms-types';

const PACKAGE_NAME = '@open-agency/cms-client';
const PAYLOAD_API_URL_ENV = 'PAYLOAD_API_URL';
const PAYLOAD_API_KEY_ENV = 'PAYLOAD_API_KEY';
const REVALIDATE_SECRET_ENV = 'REVALIDATE_SECRET';
const PAYLOAD_USERS_COLLECTION_SLUG = 'users';
const DEFAULT_PAYLOAD_DEPTH = '2';
const BLOG_REVALIDATE_SECONDS = 3600;

type PayloadCollections = Config['collections'];
type CmsCollectionSlug = 'authors' | 'blog-posts' | 'courses' | 'lessons';
type CollectionDocument<TSlug extends CmsCollectionSlug> = PayloadCollections[TSlug];
type PayloadListResponse<TDocument> = Readonly<{
  docs: TDocument[];
}>;
type NextFetchOptions = Readonly<{
  revalidate?: number;
  tags?: string[];
}>;
type CmsFetchOptions = RequestInit & {
  next?: NextFetchOptions;
};

const REVALIDATE_CONTENT_TYPES = ['author', 'blog-post', 'course', 'lesson'] as const;
const REVALIDATE_EVENT_TYPES = ['delete', 'publish', 'slug-change', 'unpublish'] as const;

export const REVALIDATE_SECRET_HEADER = 'x-revalidate-secret';

export type RevalidateContentType = (typeof REVALIDATE_CONTENT_TYPES)[number];
export type RevalidateEventType = (typeof REVALIDATE_EVENT_TYPES)[number];
export type RevalidateRequestBody = Readonly<{
  contentType: RevalidateContentType;
  eventType: RevalidateEventType;
  previousSlug?: string;
  slug: string;
}>;
export type RevalidateSuccessResponse = Readonly<{
  contentType: RevalidateContentType;
  eventType: RevalidateEventType;
  invalidated: Readonly<{
    paths: string[];
    tags: string[];
  }>;
  ok: true;
}>;
export type RevalidateErrorCode =
  | 'invalid_content_type'
  | 'invalid_json'
  | 'invalid_method'
  | 'invalid_secret'
  | 'invalid_payload'
  | 'unsupported_payload';
export type RevalidateErrorResponse = Readonly<{
  error: Readonly<{
    code: RevalidateErrorCode;
    message: string;
  }>;
  ok: false;
}>;
type RevalidateValidationSuccess = Readonly<{
  body: RevalidateRequestBody;
  ok: true;
}>;
type RevalidateValidationFailure = Readonly<{
  ok: false;
  response: RevalidateErrorResponse;
  status: number;
}>;
export type RevalidateValidationResult = RevalidateValidationFailure | RevalidateValidationSuccess;

export type Author = CollectionDocument<'authors'>;
export type BlogPost = CollectionDocument<'blog-posts'>;
export type Course = CollectionDocument<'courses'>;
export type Lesson = CollectionDocument<'lessons'>;

function assertServerOnlyContext(): void {
  if (typeof window !== 'undefined') {
    throw new Error(`${PACKAGE_NAME} must only be imported from server-side modules.`);
  }
}

function readRequiredEnv(
  name: typeof PAYLOAD_API_URL_ENV | typeof PAYLOAD_API_KEY_ENV | typeof REVALIDATE_SECRET_ENV,
): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${PACKAGE_NAME} requires ${name} to be set in the server runtime.`);
  }

  return value;
}

function normalizeApiUrl(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

assertServerOnlyContext();

export type CmsServerEnv = Readonly<{
  apiKey: string;
  apiUrl: string;
  revalidateSecret: string;
}>;

type CmsReadEnv = Readonly<{
  apiKey: string;
  apiUrl: string;
}>;

export function getBlogListTag(): 'blog:list' {
  return 'blog:list';
}

export function getBlogSlugTag(slug: string): `blog:slug:${string}` {
  return `blog:slug:${assertSlug(slug, 'blog post')}`;
}

export function getCourseListTag(): 'course:list' {
  return 'course:list';
}

export function getCourseSlugTag(slug: string): `course:slug:${string}` {
  return `course:slug:${assertSlug(slug, 'course')}`;
}

export function getLessonSlugTag(slug: string): `lesson:slug:${string}` {
  return `lesson:slug:${assertSlug(slug, 'lesson')}`;
}

export function getAuthorSlugTag(slug: string): `author:slug:${string}` {
  return `author:slug:${assertSlug(slug, 'author')}`;
}

export function getPayloadApiUrl(): string {
  return normalizeApiUrl(readRequiredEnv(PAYLOAD_API_URL_ENV));
}

export function getPayloadApiKey(): string {
  return readRequiredEnv(PAYLOAD_API_KEY_ENV);
}

export function getRevalidateSecret(): string {
  return readRequiredEnv(REVALIDATE_SECRET_ENV);
}

export function getCmsServerEnv(): CmsServerEnv {
  return {
    apiKey: getPayloadApiKey(),
    apiUrl: getPayloadApiUrl(),
    revalidateSecret: getRevalidateSecret(),
  };
}

function getCmsReadEnv(): CmsReadEnv {
  return {
    apiKey: getPayloadApiKey(),
    apiUrl: getPayloadApiUrl(),
  };
}

function isRevalidateContentType(value: unknown): value is RevalidateContentType {
  return typeof value === 'string' && REVALIDATE_CONTENT_TYPES.includes(value as RevalidateContentType);
}

function isRevalidateEventType(value: unknown): value is RevalidateEventType {
  return typeof value === 'string' && REVALIDATE_EVENT_TYPES.includes(value as RevalidateEventType);
}

function createRevalidateErrorResponse(code: RevalidateErrorCode, message: string): RevalidateErrorResponse {
  return {
    error: {
      code,
      message,
    },
    ok: false,
  };
}

export function createRevalidateSuccessResponse(
  body: RevalidateRequestBody,
  invalidated: { paths: string[]; tags: string[] },
): RevalidateSuccessResponse {
  return {
    contentType: body.contentType,
    eventType: body.eventType,
    invalidated: {
      paths: Array.from(new Set(invalidated.paths)),
      tags: Array.from(new Set(invalidated.tags)),
    },
    ok: true,
  };
}

export async function validateRevalidateRequest(request: Request): Promise<RevalidateValidationResult> {
  if (request.method !== 'POST') {
    return {
      ok: false,
      response: createRevalidateErrorResponse('invalid_method', 'Only POST requests are supported.'),
      status: 405,
    };
  }

  const contentType = request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase();

  if (contentType !== 'application/json') {
    return {
      ok: false,
      response: createRevalidateErrorResponse('invalid_content_type', 'Content-Type must be application/json.'),
      status: 400,
    };
  }

  const secret = request.headers.get(REVALIDATE_SECRET_HEADER)?.trim();

  if (!secret || secret !== getRevalidateSecret()) {
    return {
      ok: false,
      response: createRevalidateErrorResponse('invalid_secret', 'The revalidation secret is invalid.'),
      status: 401,
    };
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return {
      ok: false,
      response: createRevalidateErrorResponse('invalid_json', 'Request body must be valid JSON.'),
      status: 400,
    };
  }

  if (!isRecord(payload)) {
    return {
      ok: false,
      response: createRevalidateErrorResponse('invalid_payload', 'Request body must be a JSON object.'),
      status: 400,
    };
  }

  const { contentType: payloadContentType, eventType, previousSlug, slug } = payload;

  if (!isRevalidateContentType(payloadContentType)) {
    return {
      ok: false,
      response: createRevalidateErrorResponse('invalid_payload', 'contentType must be one of: author, blog-post, course, lesson.'),
      status: 400,
    };
  }

  if (!isRevalidateEventType(eventType)) {
    return {
      ok: false,
      response: createRevalidateErrorResponse('invalid_payload', 'eventType must be one of: publish, unpublish, delete, slug-change.'),
      status: 400,
    };
  }

  if (typeof slug !== 'string' || slug.trim().length === 0) {
    return {
      ok: false,
      response: createRevalidateErrorResponse('invalid_payload', 'slug must be a non-empty string.'),
      status: 400,
    };
  }

  if (previousSlug !== undefined && (typeof previousSlug !== 'string' || previousSlug.trim().length === 0)) {
    return {
      ok: false,
      response: createRevalidateErrorResponse('invalid_payload', 'previousSlug must be a non-empty string when provided.'),
      status: 400,
    };
  }

  if (eventType === 'slug-change' && (typeof previousSlug !== 'string' || previousSlug.trim().length === 0)) {
    return {
      ok: false,
      response: createRevalidateErrorResponse('invalid_payload', 'previousSlug is required for slug-change events.'),
      status: 400,
    };
  }

  return {
    body: {
      contentType: payloadContentType,
      eventType,
      previousSlug: typeof previousSlug === 'string' ? previousSlug.trim() : undefined,
      slug: slug.trim(),
    },
    ok: true,
  };
}

export function createUnsupportedRevalidateResponse(contentType: RevalidateContentType): RevalidateErrorResponse {
  return createRevalidateErrorResponse(
    'unsupported_payload',
    `This app does not support ${contentType} revalidation payloads.`,
  );
}

function assertSlug(slug: string, label: string): string {
  const normalizedSlug = slug.trim();

  if (!normalizedSlug) {
    throw new Error(`${PACKAGE_NAME} requires a non-empty ${label} slug.`);
  }

  return normalizedSlug;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function assertDocumentIdentifiers(value: unknown, context: string): void {
  if (!isRecord(value)) {
    throw new Error(`${PACKAGE_NAME} received a malformed ${context} document.`);
  }

  const id = value.id;
  const slug = value.slug;

  const hasValidId = typeof id === 'number' || (typeof id === 'string' && id.trim().length > 0);
  const hasValidSlug = typeof slug === 'string' && slug.trim().length > 0;

  if (!hasValidId || !hasValidSlug) {
    throw new Error(`${PACKAGE_NAME} received a ${context} document without the required id and slug.`);
  }
}

function assertListResponse<TDocument>(value: unknown, context: string): asserts value is PayloadListResponse<TDocument> {
  if (!isRecord(value) || !Array.isArray(value.docs)) {
    throw new Error(`${PACKAGE_NAME} received a malformed ${context} response.`);
  }
}

function buildCollectionUrl(collection: CmsCollectionSlug, searchParams?: URLSearchParams): string {
  const url = new URL(collection, `${getPayloadApiUrl()}/`);

  if (searchParams) {
    url.search = searchParams.toString();
  }

  return url.toString();
}

function collectionUsesExplicitStatus(collection: CmsCollectionSlug): boolean {
  return collection === 'courses' || collection === 'lessons';
}

function createPublishedCollectionQuery(collection: CmsCollectionSlug, slug?: string, sort?: string): URLSearchParams {
  const searchParams = new URLSearchParams();

  searchParams.set('depth', DEFAULT_PAYLOAD_DEPTH);
  searchParams.set('where[_status][equals]', 'published');

  if (collectionUsesExplicitStatus(collection)) {
    searchParams.set('where[status][equals]', 'published');
  }

  if (sort) {
    searchParams.set('sort', sort);
  }

  if (slug) {
    searchParams.set('limit', '1');
    searchParams.set('where[slug][equals]', slug);
  }

  return searchParams;
}

async function parseJsonResponse(response: Response, context: string): Promise<unknown> {
  if (!response.ok) {
    throw new Error(
      `${PACKAGE_NAME} failed to fetch ${context}: ${response.status} ${response.statusText}.`,
    );
  }

  try {
    return await response.json();
  } catch {
    throw new Error(`${PACKAGE_NAME} received invalid JSON while fetching ${context}.`);
  }
}

async function fetchCollectionDocuments<TSlug extends CmsCollectionSlug>(
  collection: TSlug,
  context: string,
  options: {
    next: NextFetchOptions;
    slug?: string;
    sort?: string;
  },
): Promise<Array<CollectionDocument<TSlug>>> {
  const { apiKey } = getCmsReadEnv();
  const requestOptions: CmsFetchOptions = {
    cache: 'force-cache',
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `${PAYLOAD_USERS_COLLECTION_SLUG} API-Key ${apiKey}`,
    },
    next: options.next,
  };

  const response = await fetch(
    buildCollectionUrl(collection, createPublishedCollectionQuery(collection, options.slug, options.sort)),
    requestOptions as RequestInit,
  );

  const payload = await parseJsonResponse(response, context);
  assertListResponse<CollectionDocument<TSlug>>(payload, context);

  return payload.docs.map((document) => {
    assertDocumentIdentifiers(document, context);
    return document;
  });
}

async function fetchCollectionDocument<TSlug extends CmsCollectionSlug>(
  collection: TSlug,
  context: string,
  slug: string,
  next: NextFetchOptions,
  sort?: string,
): Promise<CollectionDocument<TSlug> | null> {
  const normalizedSlug = assertSlug(slug, context);
  const documents = await fetchCollectionDocuments(collection, context, {
    next,
    slug: normalizedSlug,
    sort,
  });

  return documents[0] ?? null;
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  return fetchCollectionDocument('blog-posts', 'blog post', slug, {
    revalidate: BLOG_REVALIDATE_SECONDS,
    tags: [getBlogSlugTag(slug)],
  }, '-publishedAt');
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  return fetchCollectionDocuments('blog-posts', 'blog posts', {
    next: {
      revalidate: BLOG_REVALIDATE_SECONDS,
      tags: [getBlogListTag()],
    },
    sort: '-publishedAt',
  });
}

export async function getCourse(slug: string): Promise<Course | null> {
  return fetchCollectionDocument('courses', 'course', slug, {
    tags: [getCourseSlugTag(slug)],
  });
}

export async function getCourses(): Promise<Course[]> {
  return fetchCollectionDocuments('courses', 'courses', {
    next: {
      tags: [getCourseListTag()],
    },
    sort: 'title',
  });
}

export async function getLesson(slug: string): Promise<Lesson | null> {
  return fetchCollectionDocument('lessons', 'lesson', slug, {
    tags: [getLessonSlugTag(slug)],
  });
}

export async function getAuthor(slug: string): Promise<Author | null> {
  return fetchCollectionDocument('authors', 'author', slug, {
    tags: [getAuthorSlugTag(slug)],
  }, 'name');
}
