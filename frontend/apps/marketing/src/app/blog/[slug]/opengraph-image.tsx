import { ImageResponse } from 'next/og';

import { getBlogDetail } from '../blog-data';

export const size = {
  height: 630,
  width: 1200,
};

export const contentType = 'image/png';
export const dynamic = 'force-dynamic';

export default async function BlogPostOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogDetail(slug);

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #060e20 0%, #0b1326 42%, #171f33 100%)',
          color: '#e8eaf0',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'space-between',
          padding: '72px',
          width: '100%',
        }}
      >
        <div
          style={{
            alignItems: 'center',
            color: '#00daf3',
            display: 'flex',
            fontSize: 26,
            gap: 18,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
          }}
        >
          <div style={{ border: '2px solid currentColor', display: 'flex', height: 44, width: 44 }} />
          <span>{post?.category ?? 'Open Agency guide'}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 900 }}>
          <div style={{ fontSize: 74, fontWeight: 700, letterSpacing: '-0.06em', lineHeight: 0.95 }}>
            {post?.title ?? 'Open Agency'}
          </div>
          <div style={{ color: '#c1c6d7', display: 'flex', fontSize: 28, lineHeight: 1.4, maxWidth: 860 }}>
            {post?.excerpt ?? 'Practical AI systems, workflows, and guides — built in public.'}
          </div>
        </div>

        <div
          style={{
            alignItems: 'center',
            color: '#c1c6d7',
            display: 'flex',
            fontSize: 24,
            justifyContent: 'space-between',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          <span>open-agency.io</span>
          <span>{post?.readingTime ?? 'Practical AI guide'}</span>
        </div>
      </div>
    ),
    size,
  );
}
