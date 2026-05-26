import type { AccessArgs } from 'payload'

import type { User } from '@/payload-types'

type isUser = (args: AccessArgs<User>) => boolean

export const usersOnly: isUser = ({ req: { user } }) => {
  return user?.collection === 'users'
}
