import type { Payload } from 'payload'
import { Forbidden, getPayload, ValidationError } from 'payload'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { LegalDocuments } from '@/collections/LegalDocuments'
import config from '@/payload.config'
import type { LegalDocument, User } from '@/payload-types'

const testVersionLabel = 'legal-documents-integration-test'

const legalDocumentSlugs = {
  privacy: '/privacy',
  terms: '/terms',
} as const

type LegalDocumentType = keyof typeof legalDocumentSlugs
type UserRole = NonNullable<User['roles']>[number]
type LegalDocumentData = Pick<
  LegalDocument,
  'content' | 'effectiveAt' | 'slug' | 'title' | 'type' | 'versionLabel'
>

let payload: Payload

function legalDocumentData(type: LegalDocumentType, title: string): LegalDocumentData {
  return {
    content: {
      root: {
        children: [
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: 'Approved legal text.',
                type: 'text',
                version: 1,
              },
            ],
            direction: null,
            format: '',
            indent: 0,
            type: 'paragraph',
            version: 1,
          },
        ],
        direction: null,
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    },
    effectiveAt: '2026-07-14T00:00:00.000Z',
    slug: legalDocumentSlugs[type],
    title,
    type,
    versionLabel: testVersionLabel,
  }
}

async function createTestUser(role: UserRole): Promise<User> {
  return payload.create({
    collection: 'users',
    data: {
      email: `${role}-${crypto.randomUUID()}@legal-documents.test`,
      password: 'integration-test-password',
      roles: [role],
    },
    overrideAccess: true,
  })
}

async function removeTestRecords(): Promise<void> {
  await payload.delete({
    collection: 'legal-documents',
    context: {
      disableRevalidate: true,
    },
    overrideAccess: true,
    where: {
      versionLabel: {
        equals: testVersionLabel,
      },
    },
  })

  await payload.delete({
    collection: 'users',
    overrideAccess: true,
    where: {
      email: {
        like: '%@legal-documents.test',
      },
    },
  })
}

describe('legal document version configuration', () => {
  it('enables scheduled publishing for legal document drafts', () => {
    // Given: the legal document collection configuration
    // When: draft version settings are inspected
    const versions = LegalDocuments.versions

    // Then: drafts support the same scheduled publishing workflow as pages and blog posts
    expect(versions).toMatchObject({
      drafts: {
        schedulePublish: true,
      },
    })
  })
})

describe('legal document Local API access', () => {
  beforeAll(async () => {
    payload = await getPayload({ config })
  })

  afterEach(removeTestRecords)

  afterAll(async () => {
    await payload.destroy()
  })

  it('keeps an editor draft private from anonymous reads', async () => {
    // Given: an editor-created legal document draft
    const editor = await createTestUser('editor')
    const draft = await payload.create({
      collection: 'legal-documents',
      context: {
        disableRevalidate: true,
      },
      data: legalDocumentData('privacy', 'Privacy Policy'),
      draft: true,
      overrideAccess: false,
      user: editor,
    })

    // When: an anonymous request uses the Local API with access enforcement
    const anonymousResult = await payload.find({
      collection: 'legal-documents',
      overrideAccess: false,
    })

    // Then: the draft is not visible
    expect(anonymousResult.docs.some((document) => document.id === draft.id)).toBe(false)
  })

  it('rejects an editor publishing a legal document', async () => {
    // Given: an editor-created legal document draft
    const editor = await createTestUser('editor')
    const draft = await payload.create({
      collection: 'legal-documents',
      context: {
        disableRevalidate: true,
      },
      data: legalDocumentData('privacy', 'Privacy Policy'),
      draft: true,
      overrideAccess: false,
      user: editor,
    })

    // When: the editor attempts to publish it
    const publishAttempt = payload.update({
      collection: 'legal-documents',
      context: {
        disableRevalidate: true,
      },
      data: {
        _status: 'published',
      },
      draft: false,
      id: draft.id,
      overrideAccess: false,
      user: editor,
    })

    // Then: publishing is denied
    await expect(publishAttempt).rejects.toBeInstanceOf(ValidationError)
  })

  it('rejects an editor deleting a legal document', async () => {
    // Given: an editor-created legal document draft
    const editor = await createTestUser('editor')
    const draft = await payload.create({
      collection: 'legal-documents',
      data: legalDocumentData('privacy', 'Privacy Policy'),
      draft: true,
      overrideAccess: false,
      user: editor,
    })

    // When: the editor attempts to delete it
    const deleteAttempt = payload.delete({
      collection: 'legal-documents',
      context: {
        disableRevalidate: true,
      },
      id: draft.id,
      overrideAccess: false,
      user: editor,
    })

    // Then: deletion is denied
    await expect(deleteAttempt).rejects.toBeInstanceOf(Forbidden)
  })

  it('rejects a duplicate legal document type', async () => {
    // Given: an existing privacy document draft
    const editor = await createTestUser('editor')
    await payload.create({
      collection: 'legal-documents',
      context: {
        disableRevalidate: true,
      },
      data: legalDocumentData('privacy', 'Privacy Policy'),
      draft: true,
      overrideAccess: false,
      user: editor,
    })

    // When: an editor creates another privacy document
    const duplicateAttempt = payload.create({
      collection: 'legal-documents',
      context: {
        disableRevalidate: true,
      },
      data: legalDocumentData('privacy', 'Privacy Policy Revision'),
      draft: true,
      overrideAccess: false,
      user: editor,
    })

    // Then: the duplicate type is rejected before persistence
    await expect(duplicateAttempt).rejects.toBeInstanceOf(ValidationError)
  })

  it('blocks an admin from publishing a document with unresolved placeholders', async () => {
    // Given: a draft whose title contains an unresolved placeholder
    const admin = await createTestUser('admin')
    const draft = await payload.create({
      collection: 'legal-documents',
      context: {
        disableRevalidate: true,
      },
      data: {
        ...legalDocumentData('terms', 'TODO: Approved Terms of Service'),
      },
      draft: true,
      overrideAccess: false,
      user: admin,
    })

    // When: the admin attempts to publish the draft
    const publishAttempt = payload.update({
      collection: 'legal-documents',
      context: {
        disableRevalidate: true,
      },
      data: {
        _status: 'published',
      },
      draft: false,
      id: draft.id,
      overrideAccess: false,
      user: admin,
    })

    // Then: publication is blocked
    await expect(publishAttempt).rejects.toBeInstanceOf(ValidationError)
  })

  it('allows an admin to publish an approved legal document', async () => {
    // Given: an admin-created legal document draft
    const admin = await createTestUser('admin')
    const draft = await payload.create({
      collection: 'legal-documents',
      context: {
        disableRevalidate: true,
      },
      data: legalDocumentData('terms', 'Terms of Service'),
      draft: true,
      overrideAccess: false,
      user: admin,
    })

    // When: the admin publishes the approved draft
    const published = await payload.update({
      collection: 'legal-documents',
      context: {
        disableRevalidate: true,
      },
      data: {
        _status: 'published',
      },
      draft: false,
      id: draft.id,
      overrideAccess: false,
      user: admin,
    })

    // Then: the document is published
    expect(published._status).toBe('published')
  })
})
