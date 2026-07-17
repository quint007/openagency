import type { CollectionConfig } from 'payload'

import { usersOnly } from '../../access/usersOnly'

export const Users: CollectionConfig<'users'> = {
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
    {
      name: 'roles',
      type: 'select',
      access: {
        update: ({ req: { user } }) =>
          user?.collection === 'users' && user.roles?.includes('admin') === true,
      },
      defaultValue: ['editor'],
      hasMany: true,
      options: ['admin', 'editor'],
      saveToJWT: true,
    },
  ],
  timestamps: true,
}
