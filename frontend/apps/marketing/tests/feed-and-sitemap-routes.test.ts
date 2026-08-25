// @vitest-environment node

import { afterEach, expect, test, vi } from 'vitest';

import type { BlogPost } from '@open-agency/cms-client';

import { GET as feedGet } from '../src/app/feed.xml/route';
import { GET as sitemapGet } from '../src/app/sitemap.xml/route';

const { getBlogPostsMock, getLegalDocumentMock, getServerSideSitemapMock } = vi.hoisted(() => ({
  getBlogPostsMock: vi.fn(),
  getLegalDocumentMock: vi.fn(),
  getServerSideSitemapMock: vi.fn((entries: unknown) => Response.json(entries)),
}));

vi.mock('@open-agency/cms-client', () => ({
  getBlogPosts: getBlogPostsMock,
  getLegalDocument: getLegalDocumentMock,
}));

vi.mock('next-sitemap', () => ({
  getServerSideSitemap: getServerSideSitemapMock,
}));

function createBlogPost(overrides: Partial<BlogPost> = {}): BlogPost {
  return {
    _status: 'published',
    authors: [],
    category: {
      id: 12,
      slug: 'automation',
      title: 'Automation',
    },
    content: {
      root: {
        children: [],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    },
    createdAt: '2026-04-01T12:00:00.000Z',
    excerpt: 'Practical workflow notes for AI-native teams.',
    id: 101,
    meta: {},
    publishedAt: '2026-04-01T12:00:00.000Z',
    relatedBlogPosts: [],
    slug: 'automation-systems',
    tags: [{ id: '1', tag: 'ops' }],
    title: 'Automation systems',
    updatedAt: '2026-04-01T12:00:00.000Z',
    ...overrides,
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

test('feed route returns valid-looking RSS XML with blog items', async () => {
  getBlogPostsMock.mockResolvedValue([createBlogPost()]);

  const response = await feedGet();
  const xml = await response.text();

  expect(response.headers.get('Content-Type')).toBe('application/rss+xml; charset=utf-8');
  expect(xml).toContain('<rss version="2.0"');
  expect(xml).toContain('<title>Automation systems</title>');
  expect(xml).toContain('<link>http://localhost:3000/blog/automation-systems</link>');
});

test('sitemap route includes blog index and published post URLs', async () => {
  getBlogPostsMock.mockResolvedValue([createBlogPost(), createBlogPost({ id: 202, slug: 'writing-with-ai', title: 'Writing with AI' })]);
  getLegalDocumentMock.mockResolvedValue(null);

  const response = await sitemapGet();
  const entries = await response.json();

  expect(getServerSideSitemapMock).toHaveBeenCalledTimes(1);
  expect(entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ loc: 'http://localhost:3000/' }),
        expect.objectContaining({ loc: 'http://localhost:3000/blog' }),
        expect.objectContaining({ loc: 'http://localhost:3000/tools' }),
        expect.objectContaining({ loc: 'http://localhost:3000/tools/local-model-calculator' }),
        expect.objectContaining({ loc: 'http://localhost:3000/about' }),
        expect.objectContaining({ loc: 'http://localhost:3000/contact' }),
        expect.objectContaining({ loc: 'http://localhost:3000/privacy' }),
        expect.objectContaining({ loc: 'http://localhost:3000/terms' }),
        expect.objectContaining({ loc: 'http://localhost:3000/blog/automation-systems' }),
        expect.objectContaining({ loc: 'http://localhost:3000/blog/writing-with-ai' }),
      ]),
    );
    expect(entries).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ loc: 'http://localhost:3000/awesome' }),
        expect.objectContaining({ loc: 'http://localhost:3000/awesome/agents' }),
        expect.objectContaining({ loc: 'http://localhost:3000/awesome/workflows' }),
        expect.objectContaining({ loc: 'http://localhost:3000/awesome/prompts' }),
        expect.objectContaining({ loc: 'http://localhost:3000/tools/prompt-brief' }),
        expect.objectContaining({ loc: 'http://localhost:3000/tools/launch-checklist' }),
        expect.objectContaining({ loc: 'http://localhost:3000/tools/review-rubric' }),
        expect.objectContaining({ loc: 'http://localhost:3000/newsletter' }),
      ]),
    );
  });

test('sitemap route uses legal document updatedAt values and falls back for missing documents', async () => {
  getBlogPostsMock.mockResolvedValue([]);
  getLegalDocumentMock.mockImplementation((type: 'privacy' | 'terms') =>
    Promise.resolve(type === 'privacy' ? { updatedAt: '2026-06-15T12:00:00.000Z' } : null),
  );

  const response = await sitemapGet();
  const entries = await response.json();
  const privacyEntry = entries.find((entry: { loc: string }) => entry.loc.endsWith('/privacy'));
  const termsEntry = entries.find((entry: { loc: string }) => entry.loc.endsWith('/terms'));

  expect(privacyEntry.lastmod).toBe('2026-06-15T12:00:00.000Z');
  expect(termsEntry.lastmod).toEqual(expect.any(String));
});
