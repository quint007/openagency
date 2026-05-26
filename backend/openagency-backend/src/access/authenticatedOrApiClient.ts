import type { AccessArgs } from 'payload'

import type { User } from '@/payload-types'

type isAuthenticatedOrApiClient = (args: AccessArgs<User>) => boolean

export const authenticatedOrApiClient: isAuthenticatedOrApiClient = ({ req: { user } }) => {
  return user?.collection === 'users' || user?.collection === 'api-clients'
}
