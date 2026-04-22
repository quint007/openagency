import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

const { sendMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
}))

vi.mock('resend', () => ({
  Resend: vi.fn(function MockResend(this: unknown) {
    return {
      emails: {
        send: sendMock,
      },
    }
  }),
}))

const originalResendApiKey = process.env.RESEND_API_KEY
const originalServerUrl = process.env.NEXT_PUBLIC_SERVER_URL
let consoleErrorSpy: ReturnType<typeof vi.spyOn>

async function loadActionsModule() {
  return import('../src/app/newsletter/actions')
}

async function loadUnsubscribePageModule() {
  return import('../src/app/newsletter/unsubscribe/page')
}

function createFormData(email: string) {
  const formData = new FormData()
  formData.set('email', email)
  return formData
}

beforeEach(() => {
  process.env.RESEND_API_KEY = 'test-resend-key'
  process.env.NEXT_PUBLIC_SERVER_URL = 'http://localhost:3000'
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  sendMock.mockReset()
  sendMock.mockResolvedValue({ id: 'email_123' })
})

afterEach(() => {
  vi.resetModules()
  sendMock.mockReset()
  consoleErrorSpy.mockRestore()

  if (originalResendApiKey === undefined) {
    delete process.env.RESEND_API_KEY
  } else {
    process.env.RESEND_API_KEY = originalResendApiKey
  }

  if (originalServerUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SERVER_URL
  } else {
    process.env.NEXT_PUBLIC_SERVER_URL = originalServerUrl
  }
})

describe('newsletter subscribe + unsubscribe flow', () => {
  test('subscribes with Resend, includes unsubscribe link, and renders unsubscribe confirmation', async () => {
    const { newsletterSignup } = await loadActionsModule()
    const email = 'hello@example.com'

    const result = await newsletterSignup({ status: 'idle' }, createFormData(email))

    expect(result).toEqual({ status: 'success' })
    expect(sendMock).toHaveBeenCalledTimes(1)
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Open Agency <hello@open-agency.io>',
        subject: 'Welcome to the Open Agency newsletter!',
        to: email,
      }),
    )

    const [{ html }] = sendMock.mock.calls[0] ?? []

    expect(html).toContain('Welcome to Open Agency')
    expect(html).toContain('/newsletter/unsubscribe?email=hello%40example.com')

    const { default: UnsubscribePage } = await loadUnsubscribePageModule()
    render(
      await UnsubscribePage({
        searchParams: Promise.resolve({ email }),
      }),
    )

    expect(screen.getByRole('heading', { name: 'You are unsubscribed.' })).toBeTruthy()
    expect(screen.getByText('You will no longer receive emails at hello@example.com.')).toBeTruthy()
  })

  test('rejects invalid email without calling Resend', async () => {
    const { newsletterSignup } = await loadActionsModule()

    const result = await newsletterSignup({ status: 'idle' }, createFormData('not-an-email'))

    expect(result).toEqual({
      error: 'Please enter a valid email address',
      status: 'error',
    })
    expect(sendMock).not.toHaveBeenCalled()
  })

  test('returns a deterministic error when Resend send fails', async () => {
    const { newsletterSignup } = await loadActionsModule()
    sendMock.mockRejectedValueOnce(new Error('Resend unavailable'))

    const result = await newsletterSignup({ status: 'idle' }, createFormData('hello@example.com'))

    expect(result).toEqual({
      error: 'Something went wrong. Please try again.',
      status: 'error',
    })
    expect(sendMock).toHaveBeenCalledTimes(1)
  })
})
