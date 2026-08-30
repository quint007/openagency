import type { Where } from 'payload'

export type LegalDocumentRole = 'admin' | 'editor'

export type LegalDocumentUser = {
  readonly collection?: string
  readonly roles?: readonly LegalDocumentRole[]
}

const isLegalDocumentUser = (user: unknown): user is LegalDocumentUser => {
  return typeof user === 'object' && user !== null && 'collection' in user && user.collection === 'users'
}

export const canManageLegalDocuments = (user: unknown): boolean => {
  return isLegalDocumentUser(user)
}

export const canPublishLegalDocuments = (user: unknown): boolean => {
  if (!isLegalDocumentUser(user) || !Array.isArray(user.roles)) return false

  return user.roles.includes('admin')
}

export const legalDocumentsRead = (user: unknown): Where | true => {
  if (isLegalDocumentUser(user)) return true

  return {
    _status: {
      equals: 'published',
    },
  }
}
