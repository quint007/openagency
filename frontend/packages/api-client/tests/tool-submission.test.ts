import { expect, test } from 'vitest'

import { mapToolSubmissionToViewModel } from '../src'

test('maps only the supported calculator profile and canonical result envelope from a public response', () => {
  // Given: a public response with submitted-email canaries in aliases, nested data, and result strings
  const topLevelEmail = 'top-level@tool-submissions.test'
  const nestedEmail = 'nested@tool-submissions.test'

  // When: the shared API client maps the response for an application consumer
  const submission = mapToolSubmissionToViewModel({
    createdAt: '2026-08-23T00:00:00.000Z',
    email: topLevelEmail,
    id: 'submission-1',
    inputs: {
      Email: nestedEmail,
      alias: topLevelEmail,
      email: nestedEmail,
      machine: {
        email: nestedEmail,
        ramGb: 16,
      },
      os: 'macos',
      ramGb: 16,
      useCase: 'general',
      vramGb: 0,
    },
    result: {
      recommended: {
        model: {
          name: topLevelEmail,
          tags: [nestedEmail],
        },
        reasons: [nestedEmail],
      },
    },
    toolSlug: 'local-model-calculator',
  })

  // Then: the mapper exposes only the calculator contract and no submitted values
  expect(submission).toEqual({
    createdAt: '2026-08-23T00:00:00.000Z',
    id: 'submission-1',
    inputs: {
      os: 'macos',
      ramGb: 16,
      useCase: 'general',
      vramGb: 0,
    },
    result: {},
    toolSlug: 'local-model-calculator',
  })
  expect(JSON.stringify(submission)).not.toContain(topLevelEmail)
  expect(JSON.stringify(submission)).not.toContain(nestedEmail)
})
