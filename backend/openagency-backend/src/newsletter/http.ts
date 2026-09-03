import config from '@payload-config'
import { getPayload, type Payload } from 'payload'

import { isNewsletterServiceRequest } from './security'

export const authorizeNewsletterRequest = async (request: Request): Promise<Payload | null> => {
  if (!isNewsletterServiceRequest(request)) return null
  return getPayload({ config })
}

export const readJsonObject = async (request: Request): Promise<Record<string, unknown> | null> => {
  try {
    const value: unknown = await request.json()
    return value !== null && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}
