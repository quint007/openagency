import type { Payload } from 'payload'
import { getPayload } from 'payload'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'

let payload: Payload
let submittedEmails: string[] = []

const containsEmailKeyOrValue = (value: unknown, email: string): boolean => {
  if (value === email) return true
  if (Array.isArray(value)) return value.some((entry) => containsEmailKeyOrValue(entry, email))
  if (value !== null && typeof value === 'object') {
    return Object.entries(value).some(
      ([key, nestedValue]) => key === 'email' || containsEmailKeyOrValue(nestedValue, email),
    )
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
}

describe('tool submission privacy boundary', () => {
  beforeAll(async () => {
    payload = await getPayload({ config })
  })

  afterEach(removeTestSubmissions)

  afterAll(async () => {
    await payload.destroy()
  })

  it('removes nested email values when an anonymous create includes a crafted public input', async () => {
    // Given: a public calculator submission with an admin-only email and a crafted nested email
    const topLevelEmail = `top-level-${crypto.randomUUID()}@tool-submissions.test`
    const nestedEmail = `nested-${crypto.randomUUID()}@tool-submissions.test`
    submittedEmails = [topLevelEmail]

    // When: the anonymous caller creates the shareable submission
    const created = await payload.create({
      collection: 'tool-submissions',
      data: {
        email: topLevelEmail,
        inputs: {
          email: nestedEmail,
          os: 'macos',
          ramGb: 16,
          useCase: 'general',
          vramGb: 0,
        },
        result: {
          recommended: 'llama-3.1-8b',
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
    const storedSubmission = await payload.findByID({
      collection: 'tool-submissions',
      id: created.id,
      overrideAccess: true,
    })

    // Then: public and stored JSON contain the machine profile/result but neither nested email key nor value
    expect(created.inputs).toEqual({
      os: 'macos',
      ramGb: 16,
      useCase: 'general',
      vramGb: 0,
    })
    expect(containsEmailKeyOrValue(publicSubmission, topLevelEmail)).toBe(false)
    expect(containsEmailKeyOrValue(publicSubmission, nestedEmail)).toBe(false)
    expect(containsEmailKeyOrValue(storedSubmission.inputs, nestedEmail)).toBe(false)
    expect(storedSubmission.email).toBe(topLevelEmail)
  })
})
