import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getToolSubmission: vi.fn(),
}))

vi.mock('@open-agency/api-client', () => ({
  apiClient: {
    getToolSubmission: mocks.getToolSubmission,
  },
  localModelCalculatorToolSlug: 'local-model-calculator',
}))

vi.mock('../../src/app/(resources)/ResourceIndexPage', () => ({
  ResourceIndexPage: ({ children }: { readonly children: React.ReactNode }) => <main>{children}</main>,
}))

vi.mock('../../src/app/tools/local-model-calculator/LocalModelCalculator', () => ({
  LocalModelCalculator: () => <p>calculator-form</p>,
}))

import ToolDetailPage from '../../src/app/tools/[slug]/page'

const toolParams = Promise.resolve({ slug: 'local-model-calculator' })

describe('local model calculator shared results', () => {
  beforeEach(() => {
    mocks.getToolSubmission.mockReset()
  })

  it('recomputes a shared result from the stored profile instead of rendering result canaries', async () => {
    // Given: a valid stored profile and attacker-controlled presentation strings in the stored result
    const topLevelEmail = 'top-level@tool-submissions.test'
    const nestedEmail = 'nested@tool-submissions.test'
    mocks.getToolSubmission.mockResolvedValue({
      createdAt: '2026-08-23T00:00:00.000Z',
      id: 'submission-1',
      inputs: { os: 'macos', ramGb: 16, useCase: 'general', vramGb: 0 },
      result: {
        alternatives: [],
        recommended: {
          model: {
            description: topLevelEmail,
            id: 'attacker-model',
            minRamGb: 0,
            minVramGb: null,
            name: topLevelEmail,
            os: ['macos'],
            provider: topLevelEmail,
            recommendedRamGb: 0,
            strengths: ['general'],
            tags: [nestedEmail],
            url: 'https://example.test',
          },
          reasons: [nestedEmail],
          score: 999,
        },
      },
      toolSlug: 'local-model-calculator',
    })

    // When: a visitor opens the shared calculator URL
    render(
      await ToolDetailPage({
        params: toolParams,
        searchParams: Promise.resolve({ id: 'submission-1' }),
      }),
    )

    // Then: only the trusted local-catalog recommendation appears in the public HTML
    expect(screen.getByText('Llama 3.1 8B Instruct')).toBeTruthy()
    expect(screen.queryByText(topLevelEmail)).toBeNull()
    expect(screen.queryByText(nestedEmail)).toBeNull()
  })

  it.each([
    ['an unknown submission', null],
    [
      'an unsupported tool slug',
      {
        createdAt: '2026-08-23T00:00:00.000Z',
        id: 'wrong-tool',
        inputs: { os: 'macos', ramGb: 16, useCase: 'general', vramGb: 0 },
        result: {},
        toolSlug: 'other-tool',
      },
    ],
    [
      'a malformed stored profile',
      {
        createdAt: '2026-08-23T00:00:00.000Z',
        id: 'malformed-profile',
        inputs: { os: 'macos', ramGb: '16', useCase: 'general', vramGb: 0 },
        result: {},
        toolSlug: 'local-model-calculator',
      },
    ],
  ])('falls back to the calculator when the shared URL resolves %s', async (_case, submission) => {
    // Given: a shared URL whose submitted document cannot satisfy the calculator contract
    mocks.getToolSubmission.mockResolvedValue(submission)

    // When: the visitor opens the shared calculator URL
    render(
      await ToolDetailPage({
        params: toolParams,
        searchParams: Promise.resolve({ id: 'invalid-submission' }),
      }),
    )

    // Then: the normal calculator is shown instead of untrusted shared data
    expect(screen.getByText('calculator-form')).toBeTruthy()
  })
})
