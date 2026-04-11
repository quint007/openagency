import type { CollectionConfig } from 'payload'

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'

import { authenticated } from '../access/authenticated'
import { authenticatedOrPublished } from '../access/authenticatedOrPublished'
import { createGenerateUniqueSlug } from '../hooks/createGenerateUniqueSlug'
import { populatePublishedAt } from '../hooks/populatePublishedAt'
import { createRevalidateAfterChangeHook, createRevalidateAfterDeleteHook } from '../hooks/revalidateContent'
import { validatePublishedSeo } from '../hooks/validatePublishedSeo'

export const Lessons: CollectionConfig<'lessons'> = {
  slug: 'lessons',
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['title', 'module', 'updatedAt'],
    useAsTitle: 'title',
  },
  defaultPopulate: {
    module: true,
    slug: true,
    title: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
      index: true,
      required: true,
      unique: true,
    },
    {
      name: 'module',
      type: 'relationship',
      relationTo: 'modules',
      required: true,
    },
    {
      name: 'order',
      type: 'number',
      required: true,
      min: 1,
    },
    {
      name: 'estimatedMinutes',
      type: 'number',
      required: true,
      min: 1,
    },
    {
      name: 'ttsAudioUrl',
      type: 'text',
    },
    {
      name: 'isFreePreview',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
    },
    {
      type: 'tabs',
      tabs: [
        {
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),
            MetaDescriptionField({}),
            PreviewField({
              hasGenerateFn: true,
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
    },
  ],
  hooks: {
    afterChange: [createRevalidateAfterChangeHook('lessons')],
    afterDelete: [createRevalidateAfterDeleteHook('lessons')],
    beforeChange: [populatePublishedAt, validatePublishedSeo],
    beforeValidate: [createGenerateUniqueSlug()],
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
