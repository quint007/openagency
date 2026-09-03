import type { CollectionConfig } from 'payload'

export const NewsletterRequestLimits: CollectionConfig = {
  slug: 'newsletter-request-limits',
  access: {
    create: () => false,
    delete: () => false,
    read: () => false,
    update: () => false,
  },
  admin: {
    hidden: true,
  },
  fields: [
    {
      name: 'key',
      type: 'text',
      admin: { hidden: true },
      index: true,
      required: true,
      unique: true,
    },
    {
      name: 'expiresAt',
      type: 'date',
      index: true,
      required: true,
    },
  ],
  timestamps: true,
}
