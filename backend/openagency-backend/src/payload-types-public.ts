export interface Media {
  id: number;
  alt?: string | null;
  url?: string | null;
  thumbnailURL?: string | null;
  filename?: string | null;
  mimeType?: string | null;
  filesize?: number | null;
  width?: number | null;
  height?: number | null;
  [key: string]: unknown;
}

export interface Category {
  id: number;
  title: string;
  slug: string;
  [key: string]: unknown;
}

export interface Author {
  id: number;
  name: string;
  slug: string;
  role?: string | null;
  avatar?: number | Media | null;
  bio: Record<string, unknown>;
  expertiseTags?: Array<{ id?: string | null; tag: string }> | null;
  socialLinks?: Array<{ id?: string | null; platform: string; url: string }> | null;
  meta?: {
    description?: string | null;
    image?: number | Media | null;
    title?: string | null;
  };
  publishedAt?: string | null;
  updatedAt: string;
  createdAt: string;
  _status?: 'draft' | 'published' | null;
  [key: string]: unknown;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: Record<string, unknown>;
  authors: Array<number | Author>;
  category?: number | Category | null;
  tags?: Array<{ id?: string | null; tag: string }> | null;
  relatedBlogPosts?: Array<number | BlogPost> | null;
  meta?: {
    description?: string | null;
    image?: number | Media | null;
    title?: string | null;
  };
  publishedAt?: string | null;
  updatedAt: string;
  createdAt: string;
  _status?: 'draft' | 'published' | null;
  [key: string]: unknown;
}

export interface Course {
  id: number;
  title: string;
  slug: string;
  description: string;
  thumbnail?: number | Media | null;
  authors?: Array<number | Author> | null;
  status: 'draft' | 'published' | 'archived';
  isFeatured?: boolean | null;
  modules?: Array<number | Module> | null;
  content: Record<string, unknown>;
  meta?: {
    description?: string | null;
    image?: number | Media | null;
    title?: string | null;
  };
  publishedAt?: string | null;
  updatedAt: string;
  createdAt: string;
  _status?: 'draft' | 'published' | null;
  [key: string]: unknown;
}

export interface Module {
  id: number;
  title: string;
  slug: string;
  course: number | Course;
  lessons?: Array<number | Lesson> | null;
  order: number;
  publishedAt?: string | null;
  updatedAt: string;
  createdAt: string;
  _status?: 'draft' | 'published' | null;
  [key: string]: unknown;
}

export interface Lesson {
  id: number;
  title: string;
  slug: string;
  module: number | Module;
  order: number;
  estimatedMinutes: number;
  ttsAudioUrl?: string | null;
  isFreePreview?: boolean | null;
  status: 'draft' | 'published' | 'archived';
  content: Record<string, unknown>;
  meta?: {
    description?: string | null;
    image?: number | Media | null;
    title?: string | null;
  };
  publishedAt?: string | null;
  updatedAt: string;
  createdAt: string;
  _status?: 'draft' | 'published' | null;
  [key: string]: unknown;
}

export interface Config {
  collections: {
    authors: Author;
    'blog-posts': BlogPost;
    courses: Course;
    lessons: Lesson;
  };
}

export const generatedPayloadTypesContract = "export type * from './payload-types'";
