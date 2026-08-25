import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'

import { LocalModelResult } from '../../src/app/tools/local-model-calculator/LocalModelResult'

afterEach(() => {
  vi.unstubAllGlobals()
})

test('shows a copy failure when clipboard permission rejects a shared result link', async () => {
  // Given: clipboard access rejects the share-link copy request
  vi.stubGlobal('navigator', {
    clipboard: {
      writeText: vi.fn().mockRejectedValue(new DOMException('Permission denied', 'NotAllowedError')),
    },
  })
  render(
    <LocalModelResult
      result={{
        alternatives: [],
        recommended: {
          model: {
            description: 'A test model.',
            id: 'test-model',
            minRamGb: 8,
            minVramGb: null,
            name: 'Test Model',
            os: ['macos'],
            provider: 'Test Provider',
            recommendedRamGb: 16,
            strengths: ['general'],
            tags: [],
            url: 'https://example.com/model',
          },
          reasons: [],
          score: 1,
        },
      }}
      shareUrl="https://open-agency.test/tools/local-model-calculator?id=result-1"
    />,
  )

  // When: the visitor copies the share link
  fireEvent.click(screen.getByRole('button', { name: 'Copy share link' }))

  // Then: the failure is visible instead of being silently swallowed
  expect(await screen.findByText('We could not copy the share link. Please copy the URL from your browser.')).toBeDefined()
})
