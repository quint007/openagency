import type { CollectionConfig } from 'payload'

import { usersOnly } from '../access/usersOnly'

export const ApiClients: CollectionConfig = {
  slug: 'api-clients',
  access: {
    admin: usersOnly,
    create: usersOnly,
    delete: usersOnly,
    read: usersOnly,
    update: usersOnly,
  },
  admin: {
    defaultColumns: ['name', 'createdAt'],
    useAsTitle: 'name',
  },
  auth: {
    disableLocalStrategy: true,
    useAPIKey: true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
  ],
  timestamps: true,
}
