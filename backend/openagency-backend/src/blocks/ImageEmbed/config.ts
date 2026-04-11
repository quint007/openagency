import type { Block } from 'payload'

export const ImageEmbed: Block = {
  slug: 'imageEmbed',
  interfaceName: 'ImageEmbedBlock',
  fields: [
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'caption',
      type: 'text',
    },
    {
      name: 'credit',
      type: 'text',
    },
  ],
}
