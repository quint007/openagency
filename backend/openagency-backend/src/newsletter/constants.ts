export const NEWSLETTER_CONSENT_VERSION = 'newsletter-consent-2026-09-02'
export const NEWSLETTER_PURPOSE = 'newsletter_marketing'
export const NEWSLETTER_SOURCE = 'homepage-newsletter'
export const UNAPPROVED_NEWSLETTER_PRIVACY_VERSION = 'unapproved-privacy-notice'

export const CONFIRMATION_TTL_MS = 48 * 60 * 60 * 1000
export const CONFIRMATION_COOLDOWN_MS = 15 * 60 * 1000
export const PENDING_RETENTION_MS = 30 * 24 * 60 * 60 * 1000
export const PROVIDER_LEASE_MS = 5 * 60 * 1000
export const RETRY_BASE_MS = 15 * 60 * 1000
export const RETRY_MAX_MS = 24 * 60 * 60 * 1000
export const REQUEST_LIMIT_MAX = 5
export const REQUEST_LIMIT_WINDOW_MS = 15 * 60 * 1000
export const REQUEST_LIMIT_RETENTION_MS = 24 * 60 * 60 * 1000

export const isNewsletterEnabled = (): boolean => process.env.NEWSLETTER_ENABLED === 'true'
export const isNewsletterWithdrawalRequired = (): boolean =>
  process.env.NEWSLETTER_WITHDRAWAL_REQUIRED === 'true'

export const getNewsletterPrivacyVersion = (): string =>
  process.env.NEWSLETTER_PRIVACY_VERSION?.trim() || UNAPPROVED_NEWSLETTER_PRIVACY_VERSION

export const getNewsletterConfigurationError = (): string | null => {
  const enabled = isNewsletterEnabled()
  if (!enabled && !isNewsletterWithdrawalRequired()) return null
  if ((process.env.NEWSLETTER_SERVICE_SECRET?.trim().length ?? 0) < 32) {
    return 'NEWSLETTER_SERVICE_SECRET must contain at least 32 characters when newsletter collection or withdrawal is enabled.'
  }
  if (!process.env.RESEND_API_KEY?.trim() || !process.env.RESEND_AUDIENCE_ID?.trim()) {
    return 'RESEND_API_KEY and RESEND_AUDIENCE_ID are required when newsletter collection or withdrawal is enabled.'
  }
  if (!enabled) return null
  const encryptionKey = process.env.NEWSLETTER_TOKEN_ENCRYPTION_KEY?.trim() ?? ''
  if (!/^[A-Za-z0-9_-]{43}$/.test(encryptionKey) || Buffer.from(encryptionKey, 'base64url').length !== 32) {
    return 'NEWSLETTER_TOKEN_ENCRYPTION_KEY must contain 32 base64url-encoded bytes when the newsletter is enabled.'
  }
  const privacyVersion = getNewsletterPrivacyVersion()
  if (
    privacyVersion === UNAPPROVED_NEWSLETTER_PRIVACY_VERSION ||
    !/^[A-Za-z0-9][A-Za-z0-9._:-]{2,99}$/.test(privacyVersion)
  ) {
    return 'NEWSLETTER_PRIVACY_VERSION must identify the approved and archived privacy notice when the newsletter is enabled.'
  }
  return null
}

export const INVALID_CONFIRMATION_MESSAGE = 'This confirmation link is invalid or no longer current.'
export const INVALID_UNSUBSCRIBE_MESSAGE = 'This unsubscribe link is invalid.'
