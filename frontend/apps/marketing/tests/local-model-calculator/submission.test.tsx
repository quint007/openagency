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
  localModelCalculatorToolSlug: 'local-model-calculator',
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace }),
  useSearchParams: () => new URLSearchParams('campaign=organic&id=stale-submission'),
}))

describe('LocalModelCalculator submission', () => {
  beforeEach(() => {
    mocks.createToolSubmission.mockReset()
    mocks.replace.mockReset()
    mocks.createToolSubmission.mockResolvedValue({
      createdAt: '2026-08-23T00:00:00.000Z',
      id: 'submission-1',
      inputs: {},
      result: {},
      toolSlug: 'local-model-calculator',
    })
  })

  it('sends only a public machine profile and replaces the URL with the canonical share link', async () => {
    // Given: the calculator is loaded with its default machine profile
    render(<LocalModelCalculator />)
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'submitter@tool-submissions.test' },
    })

    // When: the visitor submits a valid email-gated recommendation request
    fireEvent.click(screen.getByRole('button', { name: 'Find my best-fit model' }))

    // Then: the protected email is not copied into the public inputs payload or browser URL
    await waitFor(() => {
      expect(mocks.createToolSubmission).toHaveBeenCalledWith({
        email: 'submitter@tool-submissions.test',
        inputs: {
          os: 'macos',
          ramGb: 16,
          useCase: 'general',
          vramGb: 0,
        },
        toolSlug: 'local-model-calculator',
      })
      expect(mocks.replace).toHaveBeenCalledWith('/tools/local-model-calculator?id=submission-1')
    })
  })

  it('blocks a malformed email before a public submission is created', async () => {
    // Given: the calculator has an invalid email address
    render(<LocalModelCalculator />)
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'not-an-email' },
    })
    const form = screen.getByRole('button', { name: 'Find my best-fit model' }).closest('form')

    if (!form) {
      throw new Error('Expected calculator form.')
    }

    // When: the visitor submits the recommendation request
    fireEvent.submit(form)

    // Then: no public submission is created and the validation error is shown
    expect(mocks.createToolSubmission).not.toHaveBeenCalled()
    expect(screen.getByText('Please enter a valid email address to see your recommendation.')).toBeTruthy()
  })
})
