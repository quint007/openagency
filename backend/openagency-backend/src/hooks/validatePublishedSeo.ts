import type { CollectionBeforeChangeHook } from 'payload'
import { ValidationError } from 'payload'

type MetaValue = {
  description?: string | null
  image?: number | string | { id?: number | string | null } | null
  title?: string | null
} | null

type SeoLikeData = {
  meta?: MetaValue
  ogImage?: number | string | { id?: number | string | null } | null
  seoDescription?: string | null
  seoTitle?: string | null
}

const hasImage = (image: NonNullable<MetaValue>['image']): boolean => {
  if (!image) {
    return false
  }

  if (typeof image === 'object') {
    return Boolean(image.id)
  }

  return true
}

export const validatePublishedSeo: CollectionBeforeChangeHook = ({
  collection,
  data,
  originalDoc,
}) => {
  const status = data?._status ?? originalDoc?._status

  if (status !== 'published') {
    return data
  }

  const mergedData = {
    ...(originalDoc ?? {}),
    ...(data ?? {}),
  } as SeoLikeData

  const meta = {
    ...(originalDoc?.meta ?? {}),
    ...(data?.meta ?? {}),
  } as MetaValue

  const seoTitle = mergedData.seoTitle?.trim() || meta?.title?.trim()
  const seoDescription = mergedData.seoDescription?.trim() || meta?.description?.trim()
  const ogImage = mergedData.ogImage ?? meta?.image
  const titlePath = 'seoTitle' in mergedData ? 'seoTitle' : 'meta.title'
  const descriptionPath = 'seoDescription' in mergedData ? 'seoDescription' : 'meta.description'
  const imagePath = 'ogImage' in mergedData ? 'ogImage' : 'meta.image'

  const missingFields = [
    !seoTitle ? titlePath : null,
    !seoDescription ? descriptionPath : null,
    !hasImage(ogImage) ? imagePath : null,
  ].filter(Boolean) as string[]

  if (missingFields.length === 0) {
    return data
  }

  throw new ValidationError({
    collection: collection.slug,
    errors: missingFields.map((path) => ({
      message: 'Published documents require complete SEO metadata.',
      path,
    })),
  })
}
