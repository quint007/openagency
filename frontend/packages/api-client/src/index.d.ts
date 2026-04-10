export type LatestGuideCard = {
  categoryLabel: string;
  href: `/blog/${string}`;
  readTime: string;
  summary: string;
  title: string;
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

declare class ApiClient {
  constructor(baseUrl?: string | undefined);
  get<T>(endpoint: string, options?: RequestInit & { params?: Record<string, string> }): Promise<T>;
  post<T>(endpoint: string, data?: unknown, options?: RequestInit & { params?: Record<string, string> }): Promise<T>;
  put<T>(endpoint: string, data?: unknown, options?: RequestInit & { params?: Record<string, string> }): Promise<T>;
  delete<T>(endpoint: string, options?: RequestInit & { params?: Record<string, string> }): Promise<T>;
  getLatestGuides(limit?: number): Promise<LatestGuideCard[]>;
}

export declare function mapPostToLatestGuideCard(post: PayloadPost): LatestGuideCard | null;
export declare const apiClient: ApiClient;
export default apiClient;
