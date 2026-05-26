import type { CollectionConfig } from 'payload'

import { usersOnly } from '../../access/usersOnly'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: usersOnly,
    create: usersOnly,
    delete: usersOnly,
    read: usersOnly,
    update: usersOnly,
  },
  admin: {
    defaultColumns: ['name', 'email'],
    useAsTitle: 'name',
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
    },
  ],
  timestamps: true,
}
