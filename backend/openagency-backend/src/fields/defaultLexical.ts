import type { TextFieldSingleValidation } from 'payload'
import {
  BlocksFeature,
  BoldFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  ItalicFeature,
  LinkFeature,
  ParagraphFeature,
  lexicalEditor,
  InlineToolbarFeature,
  UnderlineFeature,
  type LinkFields,
} from '@payloadcms/richtext-lexical'

import { Banner } from '@/blocks/Banner/config'
import { Callout } from '@/blocks/Callout/config'
import { CodeBlock } from '@/blocks/CodeBlock/config'
import { ImageEmbed } from '@/blocks/ImageEmbed/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'

export const defaultLexical = lexicalEditor({
  features: [
    ParagraphFeature(),
    UnderlineFeature(),
    BoldFeature(),
    ItalicFeature(),
    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
    HorizontalRuleFeature(),
    LinkFeature({
      enabledCollections: [
        'pages',
        'posts',
        'authors',
        'blog-posts',
        'courses',
        'lessons',
        'modules',
      ],
      fields: ({ defaultFields }) => {
        const defaultFieldsWithoutUrl = defaultFields.filter((field) => {
          if ('name' in field && field.name === 'url') return false
          return true
        })

        return [
          ...defaultFieldsWithoutUrl,
          {
            name: 'url',
            type: 'text',
            admin: {
              condition: (_data, siblingData) => siblingData?.linkType !== 'internal',
            },
            label: ({ t }) => t('fields:enterURL'),
            required: true,
            validate: ((value, options) => {
              if ((options?.siblingData as LinkFields)?.linkType === 'internal') {
                return true // no validation needed, as no url should exist for internal links
              }
              return value ? true : 'URL is required'
            }) as TextFieldSingleValidation,
          },
        ]
      },
    }),
    BlocksFeature({
      blocks: [Banner, Callout, CodeBlock, MediaBlock, ImageEmbed],
    }),
    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
})
