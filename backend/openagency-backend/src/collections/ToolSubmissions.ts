import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { usersOnly } from '../access/usersOnly'

export const ToolSubmissions: CollectionConfig = {
  slug: 'tool-submissions',
  access: {
    create: anyone,
    delete: usersOnly,
    read: ({ req: { user }, id }) => {
      // Admins can list and read every submission.
      if (user?.collection === 'users') {
        return true
      }

      // Public visitors can only read a specific submission by ID. This powers
      // shareable result links without exposing the full collection.
      return Boolean(id)
    },
    update: usersOnly,
  },
  admin: {
    defaultColumns: ['toolSlug', 'email', 'createdAt'],
    useAsTitle: 'toolSlug',
  },
  fields: [
    {
      name: 'toolSlug',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      access: {
        read: ({ req: { user } }) => user?.collection === 'users',
      },
    },
    {
      name: 'inputs',
      type: 'json',
      required: true,
    },
    {
      name: 'result',
      type: 'json',
      required: true,
    },
  ],
  timestamps: true,
}
