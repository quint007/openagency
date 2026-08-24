import { afterEach, beforeEach, expect, test, vi } from 'vitest'

const apiUrl = 'http://api-client.test/api'

beforeEach(() => {
  vi.resetModules()
  vi.stubEnv('NEXT_PUBLIC_API_URL', apiUrl)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

test('maps Payload create envelopes when a public tool submission is created', async () => {
  // Given: Payload returns its REST create envelope with a public document
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        doc: {
          createdAt: '2026-08-23T00:00:00.000Z',
          id: 4,
          inputs: {
            os: 'macos',
            ramGb: 16,
            useCase: 'general',
            vramGb: 0,
          },
          result: {},
          toolSlug: 'local-model-calculator',
        },
      }),
      {
        headers: { 'content-type': 'application/json' },
        status: 201,
      },
    ),
  )
  vi.stubGlobal('fetch', fetchMock)
  const { apiClient } = await import('../src')

  // When: the calculator creates a shareable result
  const created = await apiClient.createToolSubmission({
    email: 'submitter@tool-submissions.test',
    inputs: {
      os: 'macos',
      ramGb: 16,
      useCase: 'general',
      vramGb: 0,
    },
    toolSlug: 'local-model-calculator',
  })

  // Then: the client returns the id required for the share URL
  expect(created).toMatchObject({
    id: '4',
    toolSlug: 'local-model-calculator',
  })
  const [, request] = fetchMock.mock.calls[0] ?? []

  expect(JSON.parse(String(request?.body))).toEqual({
    email: 'submitter@tool-submissions.test',
    inputs: {
      os: 'macos',
      ramGb: 16,
      useCase: 'general',
      vramGb: 0,
    },
    toolSlug: 'local-model-calculator',
  })
})
