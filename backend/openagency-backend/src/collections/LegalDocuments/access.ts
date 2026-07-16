import type { Where } from 'payload'

export type LegalDocumentRole = 'admin' | 'editor'

export type LegalDocumentUser = {
  readonly roles?: readonly LegalDocumentRole[]
}

const hasLegalDocumentRoles = (user: unknown): user is LegalDocumentUser => {
  return typeof user === 'object' && user !== null && 'roles' in user && Array.isArray(user.roles)
}

export const canManageLegalDocuments = (user: unknown): boolean => {
  return Boolean(user)
}

export const canPublishLegalDocuments = (user: unknown): boolean => {
  if (!hasLegalDocumentRoles(user)) return false

  return user?.roles?.includes('admin') === true
}

export const legalDocumentsRead = (user: unknown): Where | true => {
  if (user) return true

  return {
    _status: {
      equals: 'published',
    },
  }
}
