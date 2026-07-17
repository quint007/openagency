import type { CollectionBeforeChangeHook, CollectionBeforeValidateHook } from 'payload'
import { ValidationError } from 'payload'

import { canPublishLegalDocuments } from './access'

export type LegalDocumentType = 'privacy' | 'terms'

export const legalDocumentTypes = ['privacy', 'terms'] satisfies LegalDocumentType[]

type LegalDocumentHookData = {
  readonly _status?: 'draft' | 'published'
  readonly changeSummary?: string
  readonly content?: unknown
  readonly id: number | string
  readonly introduction?: string
  readonly slug?: string
  readonly title?: string
  readonly type?: LegalDocumentType
  readonly versionLabel?: string
}

type LegalDocumentPublicationData = Pick<
  LegalDocumentHookData,
  'changeSummary' | 'content' | 'introduction' | 'title' | 'versionLabel'
>

const canonicalSlugs: Record<LegalDocumentType, string> = {
  privacy: '/privacy',
  terms: '/terms',
}

const unresolvedPlaceholderPattern = /TODO|PLACEHOLDER|___|\.\.\.|\[|\]|<|>/i

const collectContentStrings = (value: unknown): readonly string[] => {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(collectContentStrings)
  if (value !== null && typeof value === 'object') return Object.values(value).flatMap(collectContentStrings)

  return []
}

export const canonicalLegalDocumentSlug = (type: LegalDocumentType): string => canonicalSlugs[type]

export const assertCanonicalLegalDocumentSlug = (type: LegalDocumentType, slug: string): void => {
  if (slug === canonicalLegalDocumentSlug(type)) return

  throw new ValidationError({
    errors: [
      {
        message: `Legal document slug must be ${canonicalLegalDocumentSlug(type)} for ${type}.`,
        path: 'slug',
      },
    ],
  })
}

export const assertNoDuplicateLegalDocumentType = (matchingDocuments: number): void => {
  if (matchingDocuments === 0) return

  throw new ValidationError({
    errors: [
      {
        message: 'A legal document with this type already exists.',
        path: 'type',
      },
    ],
  })
}

export const assertPublishableLegalDocument = (document: LegalDocumentPublicationData): void => {
  const values = [
    document.title,
    document.introduction,
    document.versionLabel,
    document.changeSummary,
    ...collectContentStrings(document.content),
  ]

  if (!values.some((value) => typeof value === 'string' && unresolvedPlaceholderPattern.test(value))) {
    return
  }

  throw new ValidationError({
    errors: [
      {
        message: 'Cannot publish legal document: unresolved placeholder detected.',
        path: '_status',
      },
    ],
  })
}

export const enforceCanonicalLegalDocumentSlug: CollectionBeforeValidateHook<LegalDocumentHookData> = ({
  data,
  originalDoc,
}) => {
  const type = data?.type ?? originalDoc?.type
  const slug = data?.slug ?? originalDoc?.slug

  if (type && slug) assertCanonicalLegalDocumentSlug(type, slug)

  return data
}

export const guardLegalDocumentChange: CollectionBeforeChangeHook<LegalDocumentHookData> = async ({
  data,
  originalDoc,
  req,
}) => {
  const type = data.type ?? originalDoc?.type
  const status = data._status ?? originalDoc?._status

  if (status === 'published') {
    if (!canPublishLegalDocuments(req.user)) {
      throw new ValidationError({
        errors: [
          {
            message: 'Only admins can publish legal documents.',
            path: '_status',
          },
        ],
      })
    }

    assertPublishableLegalDocument({ ...originalDoc, ...data })
  }

  if (!type) return data

  const matchingDocuments = await req.payload.find({
    collection: 'legal-documents',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req,
    where: {
      and: [
        {
          type: {
            equals: type,
          },
        },
        ...(originalDoc
          ? [
              {
                id: {
                  not_equals: originalDoc.id,
                },
              },
            ]
          : []),
      ],
    },
  })

  assertNoDuplicateLegalDocumentType(matchingDocuments.totalDocs)

  return data
}
