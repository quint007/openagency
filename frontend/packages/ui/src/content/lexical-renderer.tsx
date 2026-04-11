import { Fragment, type CSSProperties, type ReactNode } from 'react';
import { createHighlighter } from 'shiki';

import { cn } from '../lib/utils';

type LexicalRootNode = {
  children?: LexicalNode[];
  type?: string;
};

type LexicalNode = {
  children?: LexicalNode[];
  detail?: number;
  fields?: Record<string, unknown>;
  format?: number | string;
  indent?: number;
  listType?: string;
  mode?: string;
  style?: string;
  tag?: string;
  text?: string;
  type?: string;
  version?: number;
};

type RichTextMedia = {
  alt?: string | null;
  height?: number | null;
  mimeType?: string | null;
  url?: string | null;
  width?: number | null;
};

type LexicalRendererProps = {
  className?: string;
  content: unknown;
};

const TEXT_FORMAT_BOLD = 1;
const TEXT_FORMAT_ITALIC = 2;
const TEXT_FORMAT_STRIKETHROUGH = 4;
const TEXT_FORMAT_UNDERLINE = 8;
const TEXT_FORMAT_CODE = 16;
const TEXT_FORMAT_SUBSCRIPT = 32;
const TEXT_FORMAT_SUPERSCRIPT = 64;

const highlighterPromise = createHighlighter({
  langs: ['bash', 'css', 'javascript', 'json', 'markdown', 'plaintext', 'typescript'],
  themes: ['github-dark-default'],
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toNodeArray(value: unknown): LexicalNode[] {
  return Array.isArray(value) ? value.filter(isRecord) as LexicalNode[] : [];
}

function getRootNode(content: unknown): LexicalRootNode | null {
  if (!isRecord(content)) {
    return null;
  }

  if (isRecord(content.root)) {
    return content.root as LexicalRootNode;
  }

  if (content.type === 'root') {
    return content as LexicalRootNode;
  }

  return null;
}

function getTextFormatMask(value: number | string | undefined): number {
  return typeof value === 'number' ? value : 0;
}

function parseInlineStyle(style: string | undefined): CSSProperties | undefined {
  if (!style) {
    return undefined;
  }

  const entries = style
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [property, ...rest] = part.split(':');
      const value = rest.join(':').trim();

      if (!property || !value) {
        return null;
      }

      const camelCaseProperty = property
        .trim()
        .replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase());

      return [camelCaseProperty, value] as const;
    })
    .filter((entry): entry is readonly [string, string] => Boolean(entry));

  if (entries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(entries) as CSSProperties;
}

function getWordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getLanguage(value: unknown): string {
  if (typeof value !== 'string') {
    return 'plaintext';
  }

  const language = value.trim().toLowerCase();
  return language.length > 0 ? language : 'plaintext';
}

function getBlockFields(node: LexicalNode): Record<string, unknown> | null {
  return isRecord(node.fields) ? node.fields : null;
}

function getMedia(value: unknown): RichTextMedia | null {
  if (!isRecord(value)) {
    return null;
  }

  return value as RichTextMedia;
}

function resolveInternalHref(relationTo: unknown, slug: unknown): string | null {
  if (typeof slug !== 'string' || slug.trim().length === 0) {
    return null;
  }

  switch (relationTo) {
    case 'blog-posts':
      return `/blog/${slug}`;
    case 'courses':
      return `/courses/${slug}`;
    case 'lessons':
      return `/lessons/${slug}`;
    case 'posts':
      return `/posts/${slug}`;
    case 'authors':
      return `/authors/${slug}`;
    case 'pages':
      return slug === 'home' ? '/' : `/${slug}`;
    default:
      return `/${slug}`;
  }
}

function resolveLink(node: LexicalNode): { href: string; isExternal: boolean } | null {
  const fields = getBlockFields(node);

  if (!fields) {
    return null;
  }

  const linkType = fields.linkType;

  if (linkType === 'custom') {
    const url = typeof fields.url === 'string' ? fields.url.trim() : '';

    if (!url) {
      return null;
    }

    return {
      href: url,
      isExternal: /^https?:\/\//.test(url) || url.startsWith('mailto:'),
    };
  }

  if (linkType === 'internal' && isRecord(fields.doc)) {
    const relationTo = fields.doc.relationTo;
    const value = fields.doc.value;
    const slug = isRecord(value) ? value.slug : undefined;
    const href = resolveInternalHref(relationTo, slug);

    if (!href) {
      return null;
    }

    return {
      href,
      isExternal: false,
    };
  }

  return null;
}

async function highlightCode(code: string, language: string): Promise<string> {
  try {
    const highlighter = await highlighterPromise;

    return highlighter.codeToHtml(code, {
      lang: getLanguage(language),
      theme: 'github-dark-default',
    });
  } catch {
    return `<pre class="shiki github-dark-default" style="background-color:#0d1117;color:#e6edf3"><code>${escapeHtml(code)}</code></pre>`;
  }
}

function renderFormattedText(node: LexicalNode, key: string): ReactNode {
  const text = node.text ?? '';
  const style = parseInlineStyle(node.style);
  const mask = getTextFormatMask(node.format);

  let content: ReactNode = text;

  if (mask & TEXT_FORMAT_CODE) {
    content = (
      <code className="rounded-[0.35rem] bg-[color:color-mix(in_srgb,var(--surface-container-high)_92%,transparent)] px-2 py-1 font-mono text-[0.9em] text-[var(--brand-primary-light)]">
        {content}
      </code>
    );
  }

  if (mask & TEXT_FORMAT_BOLD) {
    content = <strong>{content}</strong>;
  }

  if (mask & TEXT_FORMAT_ITALIC) {
    content = <em>{content}</em>;
  }

  if (mask & TEXT_FORMAT_UNDERLINE) {
    content = <span className="underline decoration-[color:color-mix(in_srgb,var(--brand-primary)_60%,transparent)] underline-offset-4">{content}</span>;
  }

  if (mask & TEXT_FORMAT_STRIKETHROUGH) {
    content = <span className="line-through">{content}</span>;
  }

  if (mask & TEXT_FORMAT_SUBSCRIPT) {
    content = <sub>{content}</sub>;
  }

  if (mask & TEXT_FORMAT_SUPERSCRIPT) {
    content = <sup>{content}</sup>;
  }

  if (!style) {
    return <Fragment key={key}>{content}</Fragment>;
  }

  return (
    <span key={key} style={style}>
      {content}
    </span>
  );
}

async function renderMediaFigure(media: RichTextMedia | null, caption?: string | null, credit?: string | null, key?: string) {
  if (!media?.url) {
    return null;
  }

  const alt = typeof media.alt === 'string' && media.alt.trim().length > 0 ? media.alt : caption ?? 'Embedded image';
  const figureCaption = [caption, credit].filter((value): value is string => typeof value === 'string' && value.trim().length > 0).join(' · ');

  return (
    <figure key={key} className="flex flex-col gap-4 overflow-hidden rounded-[1.6rem] border border-[color:color-mix(in_srgb,var(--outline-variant)_45%,transparent)] bg-[color:color-mix(in_srgb,var(--surface-container-lowest)_88%,transparent)] p-3 sm:p-4">
      <img
        src={media.url}
        alt={alt}
        width={media.width ?? undefined}
        height={media.height ?? undefined}
        className="h-auto w-full rounded-[1.1rem] border border-[color:color-mix(in_srgb,var(--outline-variant)_30%,transparent)] object-cover"
      />
      {figureCaption ? (
        <figcaption className="px-1 text-sm leading-7 text-[var(--on-surface-variant)]">{figureCaption}</figcaption>
      ) : null}
    </figure>
  );
}

async function renderBlock(node: LexicalNode, key: string): Promise<ReactNode> {
  const fields = getBlockFields(node);

  if (!fields || typeof fields.blockType !== 'string') {
    return null;
  }

  switch (fields.blockType) {
    case 'banner': {
      const style = typeof fields.style === 'string' ? fields.style : 'info';
      const toneClasses = {
        error: 'border-[color:color-mix(in_srgb,var(--brand-danger)_35%,transparent)] bg-[color:color-mix(in_srgb,var(--brand-danger)_10%,var(--surface-container-low)_90%)]',
        info: 'border-[color:color-mix(in_srgb,var(--brand-primary)_35%,transparent)] bg-[color:color-mix(in_srgb,var(--brand-primary)_10%,var(--surface-container-low)_90%)]',
        success: 'border-[color:color-mix(in_srgb,var(--brand-success)_35%,transparent)] bg-[color:color-mix(in_srgb,var(--brand-success)_10%,var(--surface-container-low)_90%)]',
        warning: 'border-[color:color-mix(in_srgb,var(--brand-warning)_35%,transparent)] bg-[color:color-mix(in_srgb,var(--brand-warning)_12%,var(--surface-container-low)_88%)]',
      } as const;

      return (
        <aside key={key} className={cn('rounded-[1.6rem] border px-5 py-5 sm:px-6', toneClasses[style as keyof typeof toneClasses] ?? toneClasses.info)}>
          <div className="flex flex-col gap-3">
            <span className="text-[0.72rem] font-medium uppercase tracking-[0.18em] text-[var(--on-surface)]">{style}</span>
            <div className="flex flex-col gap-4 text-[var(--on-surface)]">
              {await renderNodes(toNodeArray(getRootNode(fields.content)?.children), `${key}-content`)}
            </div>
          </div>
        </aside>
      );
    }
    case 'callout': {
      const variant = typeof fields.variant === 'string' ? fields.variant : 'info';
      const title = typeof fields.title === 'string' ? fields.title.trim() : '';
      const toneClasses = {
        info: 'border-[color:color-mix(in_srgb,var(--brand-primary)_35%,transparent)] bg-[color:color-mix(in_srgb,var(--brand-primary)_9%,var(--surface-container-low)_91%)]',
        tip: 'border-[color:color-mix(in_srgb,var(--brand-success)_35%,transparent)] bg-[color:color-mix(in_srgb,var(--brand-success)_10%,var(--surface-container-low)_90%)]',
        warning: 'border-[color:color-mix(in_srgb,var(--brand-warning)_35%,transparent)] bg-[color:color-mix(in_srgb,var(--brand-warning)_12%,var(--surface-container-low)_88%)]',
      } as const;

      return (
        <aside key={key} className={cn('rounded-[1.6rem] border px-5 py-5 sm:px-6', toneClasses[variant as keyof typeof toneClasses] ?? toneClasses.info)}>
          <div className="flex flex-col gap-3">
            <span className="text-[0.72rem] font-medium uppercase tracking-[0.18em] text-[var(--brand-primary-light)]">{variant}</span>
            {title ? <h3 className="text-[1.15rem] font-medium tracking-[-0.03em] text-[var(--on-surface)]">{title}</h3> : null}
            <div className="flex flex-col gap-4 text-[var(--on-surface)]">
              {await renderNodes(toNodeArray(getRootNode(fields.content)?.children), `${key}-content`)}
            </div>
          </div>
        </aside>
      );
    }
    case 'codeBlock': {
      const code = typeof fields.code === 'string' ? fields.code : '';
      const language = typeof fields.language === 'string' ? fields.language : 'plaintext';
      const html = await highlightCode(code, language);

      return (
        <figure key={key} className="overflow-hidden rounded-[1.6rem] border border-[color:color-mix(in_srgb,var(--outline-variant)_45%,transparent)] bg-[var(--surface-container-lowest)]">
          <div className="flex items-center justify-between gap-4 border-b border-[color:color-mix(in_srgb,var(--outline-variant)_35%,transparent)] px-4 py-3 sm:px-5">
            <span className="text-[0.72rem] font-medium uppercase tracking-[0.18em] text-[var(--brand-primary-light)]">{language}</span>
            <span className="text-xs text-[var(--on-surface-variant)]">Shiki server render</span>
          </div>
          <div
            className="overflow-x-auto [&_code]:font-mono [&_code]:text-[0.9rem] [&_pre]:m-0 [&_pre]:overflow-x-auto [&_pre]:bg-transparent [&_pre]:p-4 sm:[&_pre]:p-5"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </figure>
      );
    }
    case 'imageEmbed': {
      return renderMediaFigure(
        getMedia(fields.image),
        typeof fields.caption === 'string' ? fields.caption : null,
        typeof fields.credit === 'string' ? fields.credit : null,
        key,
      );
    }
    case 'mediaBlock': {
      return renderMediaFigure(getMedia(fields.media), null, null, key);
    }
    default:
      return null;
  }
}

async function renderNode(node: LexicalNode, key: string): Promise<ReactNode> {
  const children = await renderNodes(toNodeArray(node.children), `${key}-child`);

  switch (node.type) {
    case 'text':
      return renderFormattedText(node, key);
    case 'linebreak':
      return <br key={key} />;
    case 'heading': {
      const tag = node.tag === 'h1' || node.tag === 'h2' || node.tag === 'h3' || node.tag === 'h4' ? node.tag : 'h2';
      const HeadingTag = tag;
      const headingClassNames = {
        h1: 'text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.95] tracking-[-0.06em]',
        h2: 'text-[clamp(1.9rem,3vw,3rem)] leading-[1] tracking-[-0.05em]',
        h3: 'text-[clamp(1.45rem,2vw,2rem)] leading-[1.1] tracking-[-0.04em]',
        h4: 'text-[1.1rem] leading-[1.2] tracking-[-0.03em] uppercase',
      } as const;

      return (
        <HeadingTag key={key} className={cn('text-[var(--on-surface)]', headingClassNames[tag])}>
          {children}
        </HeadingTag>
      );
    }
    case 'paragraph':
      return (
        <p key={key} className="text-[1rem] leading-8 text-[var(--on-surface-variant)] sm:text-[1.05rem] sm:leading-9">
          {children.length > 0 ? children : <>&nbsp;</>}
        </p>
      );
    case 'quote':
      return (
        <blockquote key={key} className="border-l-4 border-[var(--brand-primary)] pl-5 text-[1.05rem] italic leading-8 text-[var(--on-surface)] sm:pl-6">
          {children}
        </blockquote>
      );
    case 'list': {
      const ListTag = node.listType === 'number' ? 'ol' : 'ul';

      return (
        <ListTag key={key} className={cn('ml-6 flex flex-col gap-3 text-[1rem] leading-8 text-[var(--on-surface-variant)]', node.listType === 'number' ? 'list-decimal' : 'list-disc')}>
          {children}
        </ListTag>
      );
    }
    case 'listitem':
      return <li key={key}>{children}</li>;
    case 'link': {
      const link = resolveLink(node);

      if (!link) {
        return <Fragment key={key}>{children}</Fragment>;
      }

      return (
        <a
          key={key}
          href={link.href}
          target={link.isExternal ? '_blank' : undefined}
          rel={link.isExternal ? 'noreferrer' : undefined}
          className="font-medium text-[var(--brand-primary-light)] underline decoration-[color:color-mix(in_srgb,var(--brand-primary)_55%,transparent)] underline-offset-4 transition-colors hover:text-[var(--on-surface)]"
        >
          {children}
        </a>
      );
    }
    case 'horizontalrule':
      return <hr key={key} className="border-0 border-t border-[color:color-mix(in_srgb,var(--outline-variant)_45%,transparent)]" />;
    case 'block':
      return renderBlock(node, key);
    default:
      return children.length > 0 ? <Fragment key={key}>{children}</Fragment> : null;
  }
}

async function renderNodes(nodes: LexicalNode[], keyPrefix: string): Promise<ReactNode[]> {
  const rendered = await Promise.all(nodes.map((node, index) => renderNode(node, `${keyPrefix}-${index}`)));
  return rendered.filter((value) => value !== null && value !== undefined);
}

export function extractPlainTextFromLexicalContent(content: unknown): string {
  const root = getRootNode(content);

  if (!root) {
    return '';
  }

  const visit = (nodes: LexicalNode[]): string[] => {
    return nodes.flatMap((node) => {
      if (node.type === 'text') {
        return typeof node.text === 'string' ? [node.text] : [];
      }

      if (node.type === 'block') {
        const fields = getBlockFields(node);

        if (!fields || typeof fields.blockType !== 'string') {
          return [];
        }

        switch (fields.blockType) {
          case 'codeBlock':
            return typeof fields.code === 'string' ? [fields.code] : [];
          case 'imageEmbed':
            return [fields.caption, fields.credit].filter((value): value is string => typeof value === 'string');
          case 'banner':
          case 'callout':
            return visit(toNodeArray(getRootNode(fields.content)?.children));
          default:
            return [];
        }
      }

      return visit(toNodeArray(node.children));
    });
  };

  return visit(toNodeArray(root.children)).join(' ').replace(/\s+/g, ' ').trim();
}

export function calculateReadingTimeFromLexicalContent(content: unknown): string {
  const wordCount = getWordCount(extractPlainTextFromLexicalContent(content));

  if (wordCount === 0) {
    return '1 min read';
  }

  return `${Math.max(1, Math.ceil(wordCount / 200))} min read`;
}

export async function LexicalRenderer({ className, content }: LexicalRendererProps) {
  const root = getRootNode(content);

  if (!root) {
    return null;
  }

  const nodes = await renderNodes(toNodeArray(root.children), 'lexical');

  if (nodes.length === 0) {
    return null;
  }

  return <div className={cn('flex flex-col gap-6', className)}>{nodes}</div>;
}
