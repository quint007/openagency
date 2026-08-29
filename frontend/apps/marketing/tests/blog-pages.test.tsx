import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

import type { BlogPost } from '@open-agency/cms-client';
import { LexicalRenderer } from '@open-agency/ui';

import BlogIndexPage from '../src/app/blog/page';
import { generateMetadata } from '../src/app/blog/[slug]/page';

const { getBlogPostMock, getBlogPostsMock, routerPushMock } = vi.hoisted(() => ({
  getBlogPostMock: vi.fn(),
  getBlogPostsMock: vi.fn(),
  routerPushMock: vi.fn(),
}));

vi.mock('@open-agency/cms-client', () => ({
  getBlogPost: getBlogPostMock,
  getBlogPosts: getBlogPostsMock,
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/blog',
  useRouter: () => ({ push: routerPushMock }),
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
      description: 'Practical workflow notes for AI-native teams.',
      title: 'Automation systems',
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

test('blog index ignores stale category params and renders no category controls', async () => {
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
  expect(screen.queryByRole('button', { name: 'All categories' })).toBeNull();
  expect(screen.queryByText('Filter by category')).toBeNull();

  const results = screen.getByRole('heading', { name: 'Latest published guides', level: 2 }).closest('section');

  if (!results) {
    throw new Error('Expected latest guides section.');
  }

  expect(within(results).getByRole('link', { name: 'Writing with AI' }).getAttribute('href')).toBe('/blog/writing-with-ai');
  expect(within(results).getByRole('link', { name: 'Automation systems' }).getAttribute('href')).toBe('/blog/automation-systems');
});

test('blog index filters published posts by tag URL params', async () => {
  getBlogPostsMock.mockResolvedValue([
    createBlogPost(),
    createBlogPost({
      id: 202,
      slug: 'writing-with-ai',
      tags: [{ id: '2', tag: 'voice' }],
      title: 'Writing with AI',
    }),
  ]);

  render(await BlogIndexPage({ searchParams: Promise.resolve({ tag: 'ops' }) }));

  expect(screen.getByRole('button', { name: '#ops' }).getAttribute('aria-pressed')).toBe('true');

  const results = screen.getByRole('heading', { name: 'Filtered guide results', level: 2 }).closest('section');

  if (!results) {
    throw new Error('Expected filtered results section.');
  }

  expect(within(results).getByRole('link', { name: 'Automation systems' }).getAttribute('href')).toBe('/blog/automation-systems');
  expect(within(results).queryByRole('link', { name: 'Writing with AI' })).toBeNull();
});

test('unknown blog tags show the tag-only empty state and clear action', async () => {
  getBlogPostsMock.mockResolvedValue([createBlogPost()]);

  render(await BlogIndexPage({ searchParams: Promise.resolve({ tag: 'does-not-exist' }) }));

  expect(screen.getByRole('heading', { name: 'No posts match this filter yet.', level: 3 })).toBeTruthy();
  expect(screen.getByText('Try clearing the tag to see the full published guide library.')).toBeTruthy();

  fireEvent.click(screen.getByRole('button', { name: 'Clear all filters' }));

  expect(routerPushMock).toHaveBeenCalledWith('/blog', { scroll: false });
});

test('blog post metadata sets canonical URL and OG fallback when no CMS image exists', async () => {
  getBlogPostMock.mockResolvedValue(createBlogPost());

  const metadata = await generateMetadata({ params: Promise.resolve({ slug: 'automation-systems' }) });

  expect(metadata.alternates?.canonical).toBe('http://localhost:3000/blog/automation-systems');
  expect(metadata.openGraph?.images).toEqual(['http://localhost:3000/blog/automation-systems/opengraph-image']);
  expect(metadata.title).toBe('Automation systems · Open Agency');
});

test('lexical renderer can insert an in-article element between body blocks', async () => {
  const content = {
    root: {
      children: [
        {
          children: [{ detail: 0, format: 0, mode: 'normal', style: '', text: 'First block', type: 'text', version: 1 }],
          direction: 'ltr', format: '', indent: 0, textFormat: 0, type: 'paragraph', version: 1,
        },
        {
          children: [{ detail: 0, format: 0, mode: 'normal', style: '', text: 'Second block', type: 'text', version: 1 }],
          direction: 'ltr', format: '', indent: 0, textFormat: 0, type: 'paragraph', version: 1,
        },
        {
          children: [{ detail: 0, format: 0, mode: 'normal', style: '', text: 'Third block', type: 'text', version: 1 }],
          direction: 'ltr', format: '', indent: 0, textFormat: 0, type: 'paragraph', version: 1,
        },
        {
          children: [{ detail: 0, format: 0, mode: 'normal', style: '', text: 'Fourth block', type: 'text', version: 1 }],
          direction: 'ltr', format: '', indent: 0, textFormat: 0, type: 'paragraph', version: 1,
        },
      ],
      direction: 'ltr', format: '', indent: 0, type: 'root', version: 1,
    },
  };

  render(await LexicalRenderer({
    content,
    renderAfterNode: (index) => (index === 2 ? <div data-testid="in-article-ad">Sponsored</div> : null),
  }));

  const flowText = Array.from(document.body.querySelectorAll('p,[data-testid="in-article-ad"]')).map((node) => node.textContent?.trim());

  expect(flowText).toEqual(['First block', 'Second block', 'Third block', 'Sponsored', 'Fourth block']);
});
