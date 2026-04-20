import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, test, vi } from 'vitest'

import { NewsletterSection } from '../src/app/components/homepage/NewsletterSection'
import { homepageContent } from '../src/app/homepage-content'

test('newsletter requires an email address before local submit', async () => {
  render(<NewsletterSection content={homepageContent.newsletter} />)

  const input = screen.getByRole('textbox', { name: homepageContent.newsletter.fieldLabel })

  fireEvent.click(screen.getByRole('button', { name: homepageContent.newsletter.submitLabel }))

  const alert = screen.getByRole('alert')

  expect(alert.textContent).toContain(homepageContent.newsletter.errors.required.title)
  expect(alert.textContent).toContain(homepageContent.newsletter.errors.required.description)
  expect(input.getAttribute('aria-invalid')).toBe('true')

  await waitFor(() => {
    expect(document.activeElement).toBe(input)
  })
})

test('newsletter validates email format and offers a retry path after invalid submit', async () => {
  render(<NewsletterSection content={homepageContent.newsletter} />)

  const input = screen.getByRole('textbox', { name: homepageContent.newsletter.fieldLabel })

  fireEvent.change(input, { target: { value: 'not-an-email' } })
  fireEvent.click(screen.getByRole('button', { name: homepageContent.newsletter.submitLabel }))

  const alert = screen.getByRole('alert')

  expect(alert.textContent).toContain(homepageContent.newsletter.errors.invalid.title)
  expect(alert.textContent).toContain(homepageContent.newsletter.errors.invalid.description)

  fireEvent.click(screen.getByRole('button', { name: homepageContent.newsletter.retryLabel }))

  expect(screen.queryByRole('alert')).toBeNull()

  await waitFor(() => {
    expect(document.activeElement).toBe(input)
  })
})

test('newsletter shows a deterministic local success state after valid submit', async () => {
  render(<NewsletterSection content={homepageContent.newsletter} />)

  const input = screen.getByRole('textbox', { name: homepageContent.newsletter.fieldLabel })

  fireEvent.change(input, { target: { value: 'hello@example.com' } })
  fireEvent.click(screen.getByRole('button', { name: homepageContent.newsletter.submitLabel }))

  const alert = screen.getByRole('alert')

  expect(alert.textContent).toContain(homepageContent.newsletter.success.title)
  expect(alert.textContent).toContain(homepageContent.newsletter.success.description)

  await waitFor(() => {
    expect(document.activeElement).toBe(alert.parentElement)
  })
})

test('newsletter submit stays local and never triggers a network request or form action', () => {
  const fetchSpy = vi.spyOn(globalThis, 'fetch')

  render(<NewsletterSection content={homepageContent.newsletter} />)

  const input = screen.getByRole('textbox', { name: homepageContent.newsletter.fieldLabel })
  const form = input.closest('form')

  fireEvent.change(input, { target: { value: 'hello@example.com' } })
  fireEvent.click(screen.getByRole('button', { name: homepageContent.newsletter.submitLabel }))

  expect(fetchSpy).not.toHaveBeenCalled()
  expect(form).toBeTruthy()
  expect(form?.hasAttribute('action')).toBe(false)

  fetchSpy.mockRestore()
})
