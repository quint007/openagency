import type { Payload } from 'payload'
import { getPayload, ValidationError } from 'payload'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { ToolSubmissions } from '@/collections/ToolSubmissions'
import config from '@/payload.config'

let payload: Payload
let submittedEmails: string[] = []
let submittedUserEmails: string[] = []

const containsValue = (value: unknown, expected: string): boolean => {
  if (value === expected) return true
  if (Array.isArray(value)) return value.some((entry) => containsValue(entry, expected))
  if (value !== null && typeof value === 'object') {
    return Object.values(value).some((nestedValue) => containsValue(nestedValue, expected))
  }

  return false
}

const removeTestSubmissions = async (): Promise<void> => {
  if (submittedEmails.length === 0) return

  await payload.delete({
    collection: 'tool-submissions',
    overrideAccess: true,
    where: {
      email: {
        in: submittedEmails,
      },
    },
  })

  submittedEmails = []

  if (submittedUserEmails.length === 0) return

  await payload.delete({
    collection: 'users',
    overrideAccess: true,
    where: {
      email: {
        in: submittedUserEmails,
      },
    },
  })

  submittedUserEmails = []
}

const createTestAdmin = async () => {
  const email = `admin-${crypto.randomUUID()}@tool-submissions.test`
  submittedUserEmails = [...submittedUserEmails, email]

  return payload.create({
    collection: 'users',
    data: {
      email,
      password: 'integration-test-password',
      roles: ['admin'],
    },
    overrideAccess: true,
  })
}

describe('tool submission privacy boundary', () => {
  beforeAll(async () => {
    payload = await getPayload({ config })
  })

  afterEach(removeTestSubmissions)

  afterAll(async () => {
    await payload.destroy()
  })

  it('canonicalizes anonymous calculator submissions when aliases and result fields contain submitted emails', async () => {
    // Given: an anonymous calculator submission with canaries outside the public machine profile
    const topLevelEmail = `top-level-${crypto.randomUUID()}@tool-submissions.test`
    const nestedEmail = `nested-${crypto.randomUUID()}@tool-submissions.test`
    submittedEmails = [topLevelEmail]

    // When: the caller creates the shareable submission and an anonymous reader loads it
    const created = await payload.create({
      collection: 'tool-submissions',
      data: {
        email: topLevelEmail,
        inputs: {
          Email: nestedEmail,
          alias: topLevelEmail,
          email: nestedEmail,
          nested: [{ contact: nestedEmail }],
          os: 'macos',
          ramGb: 16,
          useCase: 'general',
          vramGb: 0,
        },
        result: {
          recommended: {
            model: {
              description: topLevelEmail,
              name: topLevelEmail,
              tags: [nestedEmail],
            },
            reasons: [nestedEmail],
          },
        },
        toolSlug: 'local-model-calculator',
      },
      overrideAccess: false,
    })
    const publicSubmission = await payload.findByID({
      collection: 'tool-submissions',
      id: created.id,
      overrideAccess: false,
    })
    const admin = await createTestAdmin()
    const adminSubmission = await payload.findByID({
      collection: 'tool-submissions',
      id: created.id,
      overrideAccess: false,
      user: admin,
    })

    // Then: only the supported machine profile and canonical result envelope are public or stored
    expect(created.inputs).toEqual({
      os: 'macos',
      ramGb: 16,
      useCase: 'general',
      vramGb: 0,
    })
    expect(created.result).toEqual({})
    expect(publicSubmission.inputs).toEqual(created.inputs)
    expect(publicSubmission.result).toEqual({})
    expect(adminSubmission.inputs).toEqual(created.inputs)
    expect(adminSubmission.result).toEqual({})
    expect(containsValue(publicSubmission, topLevelEmail)).toBe(false)
    expect(containsValue(publicSubmission, nestedEmail)).toBe(false)
    expect(containsValue(adminSubmission.inputs, nestedEmail)).toBe(false)
    expect(containsValue(adminSubmission.result, topLevelEmail)).toBe(false)
    expect(containsValue(adminSubmission.result, nestedEmail)).toBe(false)
    expect(adminSubmission.email).toBe(topLevelEmail)
  })

  it('rejects unsupported calculator tool slugs before persistence', async () => {
    // Given: an anonymous submission with a non-calculator slug
    const email = `unsupported-${crypto.randomUUID()}@tool-submissions.test`

    // When: the caller tries to create the unsupported submission
    const creation = payload.create({
      collection: 'tool-submissions',
      data: {
        email,
        inputs: { os: 'macos', ramGb: 16, useCase: 'general', vramGb: 0 },
        result: {},
        toolSlug: 'other-tool',
      },
      overrideAccess: false,
    })

    // Then: the public API boundary rejects it rather than creating an arbitrary shareable record
    await expect(creation).rejects.toBeInstanceOf(ValidationError)
  })

  it('rejects malformed machine profiles before they become public records', async () => {
    // Given: an anonymous calculator submission with a non-numeric RAM value
    const email = `malformed-${crypto.randomUUID()}@tool-submissions.test`

    // When: the caller tries to create the malformed profile
    const creation = payload.create({
      collection: 'tool-submissions',
      data: {
        email,
        inputs: { os: 'macos', ramGb: '16', useCase: 'general', vramGb: 0 },
        result: {},
        toolSlug: 'local-model-calculator',
      },
      overrideAccess: false,
    })

    // Then: the public API boundary rejects it before persistence
    await expect(creation).rejects.toBeInstanceOf(ValidationError)
  })

  it('limits anonymous reads to calculator submissions addressed by ID', async () => {
    // Given: the ToolSubmissions public read access rule
    const read = ToolSubmissions.access?.read

    // When: anonymous collection and document reads are evaluated
    const collectionRead = await read?.({ id: undefined, req: { user: undefined } } as never)
    const documentRead = await read?.({ id: 'submission-1', req: { user: undefined } } as never)

    // Then: collection discovery is denied and an ID read is constrained to the supported calculator contract
    expect(collectionRead).toBe(false)
    expect(documentRead).toEqual({
      toolSlug: {
        equals: 'local-model-calculator',
      },
    })
  })
})
