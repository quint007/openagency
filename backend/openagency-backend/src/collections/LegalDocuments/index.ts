import { MetaDescriptionField, MetaTitleField } from '@payloadcms/plugin-seo/fields'
import type { CollectionConfig } from 'payload'

import { defaultLexical } from '../../fields/defaultLexical'
import {
  createRevalidateAfterChangeHook,
  createRevalidateAfterDeleteHook,
} from '../../hooks/revalidateContent'
import { canManageLegalDocuments, canPublishLegalDocuments, legalDocumentsRead } from './access'
import { enforceCanonicalLegalDocumentSlug, guardLegalDocumentChange, legalDocumentTypes } from './hooks'

export const LegalDocuments: CollectionConfig<'legal-documents'> = {
  slug: 'legal-documents',
  access: {
    admin: ({ req: { user } }) => canManageLegalDocuments(user),
    create: ({ req: { user } }) => canManageLegalDocuments(user),
    delete: ({ req: { user } }) => canPublishLegalDocuments(user),
    read: ({ req: { user } }) => legalDocumentsRead(user),
    update: ({ req: { user } }) => canManageLegalDocuments(user),
  },
  admin: {
    defaultColumns: ['type', 'title', 'versionLabel', 'updatedAt'],
    description: 'Only users with the admin role can publish or delete legal documents.',
    useAsTitle: 'title',
  },
  defaultPopulate: {
    slug: true,
    title: true,
    type: true,
  },
  fields: [
    {
      name: 'type',
      type: 'select',
      options: legalDocumentTypes,
      required: true,
      unique: true,
    },
    {
      name: 'slug',
      type: 'text',
      index: true,
      required: true,
      unique: true,
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'introduction',
      type: 'textarea',
    },
    {
      name: 'content',
      type: 'richText',
      editor: defaultLexical,
      required: true,
    },
    {
      name: 'effectiveAt',
      type: 'date',
      required: true,
    },
    {
      name: 'versionLabel',
      type: 'text',
      required: true,
    },
    {
      name: 'changeSummary',
      type: 'textarea',
    },
    {
      type: 'tabs',
      tabs: [
        {
          name: 'meta',
          label: 'SEO',
          fields: [MetaTitleField({ hasGenerateFn: true }), MetaDescriptionField({})],
        },
      ],
    },
  ],
  hooks: {
    afterChange: [createRevalidateAfterChangeHook('legal-documents')],
    afterDelete: [createRevalidateAfterDeleteHook('legal-documents')],
    beforeChange: [guardLegalDocumentChange],
    beforeValidate: [enforceCanonicalLegalDocumentSlug],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 100,
      },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}
