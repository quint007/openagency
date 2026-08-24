import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LocalModelCalculator } from '../../src/app/tools/local-model-calculator/LocalModelCalculator'

const mocks = vi.hoisted(() => ({
  createToolSubmission: vi.fn(),
  replace: vi.fn(),
}))

vi.mock('@open-agency/api-client', () => ({
  apiClient: {
    createToolSubmission: mocks.createToolSubmission,
  },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace }),
  useSearchParams: () => new URLSearchParams(),
}))

describe('LocalModelCalculator submission', () => {
  beforeEach(() => {
    mocks.createToolSubmission.mockResolvedValue({
      createdAt: '2026-08-23T00:00:00.000Z',
      id: 'submission-1',
      inputs: {},
      result: {},
      toolSlug: 'local-model-calculator',
    })
  })

  it('sends only a public machine profile when an email-gated recommendation is submitted', async () => {
    // Given: the calculator is loaded with its default machine profile
    render(<LocalModelCalculator />)
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'submitter@tool-submissions.test' },
    })

    // When: the visitor submits a valid email-gated recommendation request
    fireEvent.click(screen.getByRole('button', { name: 'Find my best-fit model' }))

    // Then: the protected email is not copied into the public inputs payload
    await waitFor(() => {
      expect(mocks.createToolSubmission).toHaveBeenCalledWith({
        email: 'submitter@tool-submissions.test',
        inputs: {
          os: 'macos',
          ramGb: 16,
          useCase: 'general',
          vramGb: 0,
        },
        result: expect.any(Object),
        toolSlug: 'local-model-calculator',
      })
    })
  })
})
