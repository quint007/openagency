import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

import {
  createRevalidateSuccessResponse,
  createUnsupportedRevalidateResponse,
  getAuthorSlugTag,
  getBlogListTag,
  getBlogSlugTag,
  type RevalidateRequestBody,
  validateRevalidateRequest,
} from '@open-agency/cms-client';

function methodNotAllowed(_request: Request): Response {
  return NextResponse.json(
    {
      error: {
        code: 'invalid_method',
        message: 'Only POST requests are supported.',
      },
      ok: false,
    },
    { status: 405 },
  );
}

function buildInvalidation(body: RevalidateRequestBody): { paths: string[]; tags: string[] } | null {
  switch (body.contentType) {
    case 'blog-post': {
      const tags = [getBlogListTag(), getBlogSlugTag(body.slug)];
      const paths = ['/', '/blog', `/blog/${body.slug}`, '/feed.xml', '/sitemap.xml'];

      if (body.eventType === 'slug-change' && body.previousSlug) {
        tags.push(getBlogSlugTag(body.previousSlug));
        paths.push(`/blog/${body.previousSlug}`);
      }

      return {
        paths,
        tags,
      };
    }
    case 'author': {
      const tags = [getAuthorSlugTag(body.slug)];

      if (body.eventType === 'slug-change' && body.previousSlug) {
        tags.push(getAuthorSlugTag(body.previousSlug));
      }

      return {
        paths: ['/'],
        tags,
      };
    }
    default:
      return null;
  }
}

export async function POST(request: Request): Promise<Response> {
  const validation = await validateRevalidateRequest(request);

  if (!validation.ok) {
    return NextResponse.json(validation.response, { status: validation.status });
  }

  const invalidation = buildInvalidation(validation.body);

  if (!invalidation) {
    return NextResponse.json(createUnsupportedRevalidateResponse(validation.body.contentType), { status: 400 });
  }

  for (const tag of invalidation.tags) {
    revalidateTag(tag, 'max');
  }

  for (const path of invalidation.paths) {
    revalidatePath(path, 'page');
  }

  return NextResponse.json(createRevalidateSuccessResponse(validation.body, invalidation));
}

export const GET = methodNotAllowed;
export const PUT = methodNotAllowed;
export const PATCH = methodNotAllowed;
export const DELETE = methodNotAllowed;
