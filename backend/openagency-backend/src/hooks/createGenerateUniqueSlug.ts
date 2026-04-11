import type { CollectionBeforeValidateHook } from 'payload'

const slugSeparatorPattern = /[^a-z0-9]+/g
const duplicatedSeparatorPattern = /-+/g

const formatSlug = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(slugSeparatorPattern, '-')
    .replace(duplicatedSeparatorPattern, '-')
    .replace(/^-|-$/g, '')
}

type SlugSource = {
  collectionSlug: Parameters<CollectionBeforeValidateHook>[0]['collection']['slug']
  currentDocId?: number | string
  initialSlug: string
  req: Parameters<CollectionBeforeValidateHook>[0]['req']
}

const ensureUniqueSlug = async ({
  currentDocId,
  initialSlug,
  collectionSlug,
  req,
}: SlugSource): Promise<string> => {
  let attempt = initialSlug
  let suffix = 1

  while (attempt) {
    const existing = await req.payload.find({
      collection: collectionSlug,
      depth: 0,
      limit: 1,
      pagination: false,
      req,
      where: {
        and: [
          {
            slug: {
              equals: attempt,
            },
          },
          ...(currentDocId
            ? [
                {
                  id: {
                    not_equals: currentDocId,
                  },
                },
              ]
            : []),
        ],
      },
    })

    if (existing.docs.length === 0) {
      return attempt
    }

    suffix += 1
    attempt = `${initialSlug}-${suffix}`
  }

  return initialSlug
}

export const createGenerateUniqueSlug = (fieldToUse = 'title'): CollectionBeforeValidateHook => {
  return async ({ collection, data, originalDoc, req }) => {
    if (!data) {
      return data
    }

    const providedSlug = typeof data.slug === 'string' ? data.slug : undefined
    const updatedSourceValue = typeof data[fieldToUse] === 'string' ? data[fieldToUse] : undefined
    const originalSlug = typeof originalDoc?.slug === 'string' ? originalDoc.slug : undefined
    const sourceValue = updatedSourceValue ?? originalDoc?.[fieldToUse]

    const baseInput = providedSlug || sourceValue || originalSlug

    if (typeof baseInput !== 'string' || baseInput.trim().length === 0) {
      return data
    }

    const formattedSlug = formatSlug(baseInput)

    if (!formattedSlug) {
      return data
    }

    const slug = await ensureUniqueSlug({
      collectionSlug: collection.slug,
      currentDocId: originalDoc?.id,
      initialSlug: formattedSlug,
      req,
    })

    return {
      ...data,
      slug,
    }
  }
}
