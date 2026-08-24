import { expect, test } from 'vitest'

import { mapToolSubmissionToViewModel } from '../src'

test('removes nested email values when mapping a public tool submission response', () => {
  // Given: a public response that contains crafted email fields inside machine inputs
  const topLevelEmail = 'top-level@tool-submissions.test'
  const nestedEmail = 'nested@tool-submissions.test'

  // When: the shared API client maps the response for an application consumer
  const submission = mapToolSubmissionToViewModel({
    createdAt: '2026-08-23T00:00:00.000Z',
    email: topLevelEmail,
    id: 'submission-1',
    inputs: {
      email: nestedEmail,
      machine: {
        email: nestedEmail,
        ramGb: 16,
      },
      os: 'macos',
    },
    result: {
      recommended: 'llama-3.1-8b',
    },
    toolSlug: 'local-model-calculator',
  })

  // Then: no mapped public data contains an email key or either submitted email value
  expect(submission).toEqual({
    createdAt: '2026-08-23T00:00:00.000Z',
    id: 'submission-1',
    inputs: {
      machine: {
        ramGb: 16,
      },
      os: 'macos',
    },
    result: {
      recommended: 'llama-3.1-8b',
    },
    toolSlug: 'local-model-calculator',
  })
  expect(JSON.stringify(submission)).not.toContain(topLevelEmail)
  expect(JSON.stringify(submission)).not.toContain(nestedEmail)
})
