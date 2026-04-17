import type { Metadata } from 'next'

import type { Config, Page, Post } from '../payload-types'
import type { CollectionSlug } from 'payload'
import type { Media } from '../payload-types'

import { mergeOpenGraph } from './mergeOpenGraph'
import { getPublicCollectionUrl, toAbsoluteUrl } from './getURL'

const getImageURL = (image?: Media | Config['db']['defaultIDType'] | null) => {
  let url = toAbsoluteUrl('/website-template-OG.webp')

  if (image && typeof image === 'object' && 'url' in image) {
    const ogUrl = image.sizes?.og?.url

    url = toAbsoluteUrl(ogUrl || image.url)
  }

  return url
}

export const generateMeta = async (args: {
  collectionSlug: Extract<CollectionSlug, 'pages' | 'posts'>
  doc: Partial<Page> | Partial<Post> | null
}): Promise<Metadata> => {
  const { collectionSlug, doc } = args

  const ogImage = getImageURL(doc?.meta?.image)

  const title = doc?.meta?.title
    ? doc?.meta?.title + ' | Payload Website Template'
    : 'Payload Website Template'

  return {
    description: doc?.meta?.description,
    openGraph: mergeOpenGraph({
      description: doc?.meta?.description || '',
      images: ogImage
        ? [
            {
              url: ogImage,
            },
          ]
        : undefined,
      title,
      url: getPublicCollectionUrl({
        collectionSlug,
        slug: Array.isArray(doc?.slug) ? doc.slug.join('/') : doc?.slug,
      }),
    }),
    title,
  }
}
