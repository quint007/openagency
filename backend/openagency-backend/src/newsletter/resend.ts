import { Resend } from 'resend'

import { getPublicSiteURL } from '../utilities/getURL'

type ProviderResult = {
  contactId?: string
  messageId?: string
}

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

const getProvider = (): { audienceId: string; resend: Resend } => {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const audienceId = process.env.RESEND_AUDIENCE_ID?.trim()

  if (!apiKey || !audienceId) {
    throw new Error('Newsletter provider configuration is missing.')
  }

  return { audienceId, resend: new Resend(apiKey) }
}

const assertProviderSuccess = <T>(response: { data: T | null; error: { name: string } | null }, operation: string): T => {
  if (response.error || !response.data) {
    throw new Error(`${operation} failed: ${response.error?.name ?? 'empty_response'}`)
  }

  return response.data
}

export const sendConfirmationEmail = async (email: string, token: string): Promise<ProviderResult> => {
  const { resend } = getProvider()
  const confirmationUrl = new URL('/newsletter/confirm', getPublicSiteURL())
  confirmationUrl.searchParams.set('t', token)
  const safeUrl = escapeHtml(confirmationUrl.toString())
  const response = await resend.emails.send({
    from: 'Open Agency <hello@open-agency.io>',
    to: email,
    subject: 'Confirm your Open Agency newsletter subscription',
    html: `<!doctype html><html><body style="background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#171717"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center"><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff"><tr><td style="padding:32px"><h1 style="font-size:24px;line-height:32px">Confirm your subscription</h1><p style="font-size:16px;line-height:24px">Confirm that you want the weekly Open Agency newsletter about practical AI workflow patterns, guides, and tools.</p><p style="font-size:16px;line-height:24px"><a href="${safeUrl}">Review and confirm your subscription</a></p><p style="font-size:14px;line-height:22px;color:#666666">This link expires after 48 hours. If you did not request this, you can ignore this email.</p><p style="font-size:14px;line-height:22px"><a href="${escapeHtml(new URL('/privacy', getPublicSiteURL()).toString())}">Privacy policy</a></p></td></tr></table></td></tr></table></body></html>`,
  })
  const data = assertProviderSuccess(response, 'newsletter confirmation email')

  return { messageId: data.id }
}

export const activateProviderContact = async (
  email: string,
): Promise<ProviderResult> => {
  const { audienceId, resend } = getProvider()
  const createResponse = await resend.contacts.create({ audienceId, email, unsubscribed: false })
  let contactId = createResponse.data?.id

  if (createResponse.error?.statusCode === 409) {
    const updateResponse = await resend.contacts.update({ audienceId, email, unsubscribed: false })
    contactId = assertProviderSuccess(updateResponse, 'newsletter contact activation').id
  } else if (createResponse.error) {
    assertProviderSuccess(createResponse, 'newsletter contact creation')
  }

  return { contactId }
}

export const sendWelcomeEmail = async (email: string, unsubscribeToken: string): Promise<ProviderResult> => {
  const { resend } = getProvider()
  const browserUnsubscribeUrl = new URL('/newsletter/unsubscribe', getPublicSiteURL())
  browserUnsubscribeUrl.searchParams.set('t', unsubscribeToken)
  const oneClickUrl = new URL('/api/newsletter/unsubscribe', getPublicSiteURL())
  oneClickUrl.searchParams.set('t', unsubscribeToken)
  const response = await resend.emails.send({
    from: 'Open Agency <hello@open-agency.io>',
    to: email,
    subject: 'Welcome to the Open Agency newsletter',
    headers: {
      'List-Unsubscribe': `<${oneClickUrl.toString()}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
    html: `<!doctype html><html><body style="background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#171717"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center"><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff"><tr><td style="padding:32px"><h1 style="font-size:24px;line-height:32px">Welcome to Open Agency</h1><p style="font-size:16px;line-height:24px">Your email address is confirmed. Expect the weekly Open Agency newsletter about practical AI workflow patterns, guides, and tools.</p><p style="font-size:14px;line-height:22px"><a href="${escapeHtml(browserUnsubscribeUrl.toString())}">Unsubscribe</a> at any time or read our <a href="${escapeHtml(new URL('/privacy', getPublicSiteURL()).toString())}">privacy policy</a>.</p></td></tr></table></td></tr></table></body></html>`,
  })
  const data = assertProviderSuccess(response, 'newsletter welcome email')

  return { messageId: data.id }
}

export const deactivateProviderContact = async (email: string): Promise<void> => {
  const { audienceId, resend } = getProvider()
  const response = await resend.contacts.update({ audienceId, email, unsubscribed: true })

  if (response.error && response.error.statusCode !== 404 && response.error.name !== 'not_found') {
    assertProviderSuccess(response, 'newsletter contact unsubscribe')
  }
}
