import { render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

import type { BlogPost } from '@open-agency/cms-client';

import BlogIndexPage from '../src/app/blog/page';
import { generateMetadata } from '../src/app/blog/[slug]/page';

const { getBlogPostMock, getBlogPostsMock } = vi.hoisted(() => ({
  getBlogPostMock: vi.fn(),
  getBlogPostsMock: vi.fn(),
}));

vi.mock('@open-agency/cms-client', () => ({
  getBlogPost: getBlogPostMock,
  getBlogPosts: getBlogPostsMock,
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/blog',
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(''),
}));

function createBlogPost(overrides: Partial<BlogPost> = {}): BlogPost {
  return {
    _status: 'published',
    authors: [
      {
        _status: 'published',
        bio: { root: { children: [], direction: 'ltr', format: '', indent: 0, type: 'root', version: 1 } },
        createdAt: '2026-04-01T12:00:00.000Z',
        id: 91,
        name: 'Jane Doe',
        slug: 'jane-doe',
        updatedAt: '2026-04-01T12:00:00.000Z',
      },
    ],
    category: {
      id: 12,
      slug: 'automation',
      title: 'Automation',
    },
    content: {
      root: {
        children: [
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: 'Practical workflow notes for AI-native teams.',
                type: 'text',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            textFormat: 0,
            type: 'paragraph',
            version: 1,
          },
        ],
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
    meta: {
      seoDescription: 'Practical workflow notes for AI-native teams.',
      seoTitle: 'Automation systems',
    },
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

test('blog index renders published posts filtered by URL params', async () => {
  getBlogPostsMock.mockResolvedValue([
    createBlogPost(),
    createBlogPost({
      category: { id: 20, slug: 'writing', title: 'Writing' },
      id: 202,
      slug: 'writing-with-ai',
      tags: [{ id: '2', tag: 'voice' }],
      title: 'Writing with AI',
    }),
  ]);

  render(await BlogIndexPage({ searchParams: Promise.resolve({ category: 'Writing' }) }));

  expect(screen.getByRole('heading', { name: /the blog for practical ai systems/i, level: 1 })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'All categories' })).toBeTruthy();

  const results = screen.getByRole('heading', { name: 'Filtered guide results', level: 2 }).closest('section');

  if (!results) {
    throw new Error('Expected filtered results section.');
  }

  expect(within(results).getByRole('link', { name: 'Writing with AI' }).getAttribute('href')).toBe('/blog/writing-with-ai');
  expect(within(results).queryByRole('link', { name: 'Automation systems' })).toBeNull();
});

test('blog post metadata sets canonical URL and OG fallback when no CMS image exists', async () => {
  getBlogPostMock.mockResolvedValue(createBlogPost());

  const metadata = await generateMetadata({ params: Promise.resolve({ slug: 'automation-systems' }) });

  expect(metadata.alternates?.canonical).toBe('http://localhost:3000/blog/automation-systems');
  expect(metadata.openGraph?.images).toEqual(['http://localhost:3000/blog/automation-systems/opengraph-image']);
  expect(metadata.title).toBe('Automation systems · Open Agency');
});
