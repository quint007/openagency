const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const DEFAULT_LATEST_GUIDES_LIMIT = 3;
const DEFAULT_GUIDE_CATEGORY_LABEL = 'Guide';
const DEFAULT_GUIDE_SUMMARY = 'Fresh guidance from the Open Agency blog.';
const DEFAULT_GUIDE_READ_TIME = '1 min read';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

type PayloadCollectionResponse<T> = {
  docs?: T[];
};

type PayloadCategory =
  | string
  | number
  | null
  | {
      title?: string | null;
    };

type PayloadPost = {
  title?: string | null;
  slug?: string | null;
  excerpt?: string | null;
  summary?: string | null;
  readTime?: string | null;
  publishedAt?: string | null;
  categories?: PayloadCategory[] | null;
  content?: unknown;
  meta?: {
    description?: string | null;
  } | null;
};

export type LatestGuideCard = {
  categoryLabel: string;
  href: `/blog/${string}`;
  readTime: string;
  summary: string;
  title: string;
};

function cleanText(value?: string | null): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length > 0 ? normalized : null;
}

function getFirstSentence(value?: string | null): string | null {
  const normalized = cleanText(value);

  if (!normalized) {
    return null;
  }

  const match = normalized.match(/.+?[.!?](?=\s|$)/);
  return match?.[0]?.trim() ?? normalized;
}

function extractTextNodes(value: unknown): string[] {
  if (typeof value === 'string') {
    const normalized = cleanText(value);
    return normalized ? [normalized] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => extractTextNodes(entry));
  }

  if (!value || typeof value !== 'object') {
    return [];
  }

  const record = value as Record<string, unknown>;
  const textEntries = typeof record.text === 'string' ? extractTextNodes(record.text) : [];

  return Object.entries(record).flatMap(([key, nestedValue]) => {
    if (key === 'text') {
      return [];
    }

    return extractTextNodes(nestedValue);
  }).concat(textEntries);
}

function estimateReadTimeFromPost(post: PayloadPost): string {
  const explicitReadTime = cleanText(post.readTime);

  if (explicitReadTime) {
    return explicitReadTime;
  }

  const candidateText = [
    cleanText(post.title),
    getFirstSentence(post.summary),
    getFirstSentence(post.excerpt),
    getFirstSentence(post.meta?.description),
    cleanText(extractTextNodes(post.content).join(' ')),
  ]
    .filter((value): value is string => Boolean(value))
    .join(' ');

  const wordCount = candidateText.split(/\s+/).filter(Boolean).length;

  if (wordCount === 0) {
    return DEFAULT_GUIDE_READ_TIME;
  }

  return `${Math.max(1, Math.ceil(wordCount / 200))} min read`;
}

function getCategoryLabel(post: PayloadPost): string {
  const firstCategory = post.categories?.find(Boolean);

  if (typeof firstCategory === 'string') {
    return cleanText(firstCategory) ?? DEFAULT_GUIDE_CATEGORY_LABEL;
  }

  if (firstCategory && typeof firstCategory === 'object') {
    return cleanText(firstCategory.title) ?? DEFAULT_GUIDE_CATEGORY_LABEL;
  }

  return DEFAULT_GUIDE_CATEGORY_LABEL;
}

export function mapPostToLatestGuideCard(post: PayloadPost): LatestGuideCard | null {
  const title = cleanText(post.title);
  const slug = cleanText(post.slug);

  if (!title || !slug) {
    return null;
  }

  return {
    categoryLabel: getCategoryLabel(post),
    href: `/blog/${encodeURIComponent(slug)}`,
    readTime: estimateReadTimeFromPost(post),
    summary:
      getFirstSentence(post.summary) ??
      getFirstSentence(post.excerpt) ??
      getFirstSentence(post.meta?.description) ??
      DEFAULT_GUIDE_SUMMARY,
    title,
  };
}

class ApiClient {
  private baseUrl?: string;

  constructor(baseUrl: string | undefined = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private getBaseUrl(): string {
    if (!this.baseUrl) {
      throw new Error('NEXT_PUBLIC_API_URL must be set for the API client');
    }

    return this.baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;
    let url = `${this.getBaseUrl()}${endpoint}`;

    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  async getLatestGuides(limit: number = DEFAULT_LATEST_GUIDES_LIMIT): Promise<LatestGuideCard[]> {
    const response = await this.get<PayloadCollectionResponse<PayloadPost>>('/posts', {
      cache: 'no-store',
      params: {
        depth: '1',
        limit: String(limit),
        sort: '-publishedAt',
        'where[_status][equals]': 'published',
      },
    });

    return (response.docs ?? [])
      .map((post) => mapPostToLatestGuideCard(post))
      .filter((card): card is LatestGuideCard => Boolean(card))
      .slice(0, limit);
  }
}

export const apiClient = new ApiClient();
export default apiClient;
