import crypto from 'node:crypto'
import type { Payload } from 'payload'
import { getPayload } from 'payload'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import config from '@/payload.config'
import { POST as runMaintenanceRoute } from '@/app/(payload)/api/newsletter/maintenance/route'
import type { NewsletterSubscription, User } from '@/payload-types'
import { PENDING_RETENTION_MS, getNewsletterConfigurationError } from '@/newsletter/constants'
import { createOpaqueToken, hashOpaqueToken, isNewsletterMaintenanceRequest } from '@/newsletter/security'
import {
  confirmNewsletterSubscription,
  consumeNewsletterRequestLimit,
  inspectNewsletterConfirmation,
  inspectNewsletterUnsubscribe,
  requestNewsletterSubscription,
  runNewsletterMaintenance,
  unsubscribeNewsletterSubscription,
} from '@/newsletter/service'

const { activateProviderContact, deactivateProviderContact, sendConfirmationEmail, sendWelcomeEmail } = vi.hoisted(
  () => ({
    activateProviderContact: vi.fn(),
    deactivateProviderContact: vi.fn(),
    sendConfirmationEmail: vi.fn(),
    sendWelcomeEmail: vi.fn(),
  }),
)

vi.mock('@/newsletter/resend', () => ({
  activateProviderContact,
  deactivateProviderContact,
  sendConfirmationEmail,
  sendWelcomeEmail,
}))

const testEmailSuffix = '@newsletter-consent.test'
const privacyVersionLabel = 'privacy-2026-09-02'
const createdSubscriptionIds = new Set<number>()
let payload: Payload
let adminUser: User | null = null
let privacyDocumentCreated = false

const initialEncryptionKey = process.env.NEWSLETTER_TOKEN_ENCRYPTION_KEY
const initialEnabled = process.env.NEWSLETTER_ENABLED
const initialPrivacyVersion = process.env.NEWSLETTER_PRIVACY_VERSION
const initialWithdrawalRequired = process.env.NEWSLETTER_WITHDRAWAL_REQUIRED
const initialServiceSecret = process.env.NEWSLETTER_SERVICE_SECRET
const initialResendApiKey = process.env.RESEND_API_KEY
const initialResendAudienceId = process.env.RESEND_AUDIENCE_ID

const validEncryptionKey = (): string => crypto.randomBytes(32).toString('base64url')

function saveEnv(keys: string[]): Record<string, string | undefined> {
  const saved: Record<string, string | undefined> = {}
  for (const key of keys) {
    saved[key] = process.env[key]
  }
  return saved
}

function restoreEnv(saved: Record<string, string | undefined>): void {
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }
}

function privacyDocumentData(): Record<string, unknown> {
  return {
    content: {
      root: {
        children: [
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: 'Newsletter privacy notice text.',
                type: 'text',
                version: 1,
              },
            ],
            direction: null,
            format: '',
            indent: 0,
            type: 'paragraph',
            version: 1,
          },
        ],
        direction: null,
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    },
    effectiveAt: '2026-09-02T00:00:00.000Z',
    slug: '/privacy',
    title: 'Privacy Policy',
    type: 'privacy',
    versionLabel: privacyVersionLabel,
  }
}

async function createAdminUser(): Promise<User> {
  return payload.create({
    collection: 'users',
    data: {
      email: `newsletter-admin-${crypto.randomUUID()}@legal-documents.test`,
      password: 'integration-test-password',
      roles: ['admin'],
    },
    overrideAccess: true,
  })
}

async function findPublishedPrivacyDocument(versionLabel: string): Promise<number | null> {
  const result = await payload.find({
    collection: 'legal-documents',
    depth: 0,
    draft: false,
    limit: 1,
    overrideAccess: true,
    where: {
      and: [
        { _status: { equals: 'published' } },
        { type: { equals: 'privacy' } },
        { versionLabel: { equals: versionLabel } },
      ],
    },
  })
  return result.docs[0]?.id ?? null
}

async function createPublishedPrivacyDocument(admin: User): Promise<number> {
  const draft = await payload.create({
    collection: 'legal-documents',
    context: { disableRevalidate: true },
    data: privacyDocumentData(),
    draft: true,
    overrideAccess: false,
    user: admin,
  })
  const published = await payload.update({
    collection: 'legal-documents',
    context: { disableRevalidate: true },
    data: { _status: 'published' },
    draft: false,
    id: draft.id,
    overrideAccess: false,
    user: admin,
  })
  return published.id
}

async function ensurePrivacyDocument(admin: User): Promise<number> {
  const existing = await findPublishedPrivacyDocument(privacyVersionLabel)
  if (existing) return existing
  privacyDocumentCreated = true
  return createPublishedPrivacyDocument(admin)
}

async function findSubscription(email: string): Promise<NewsletterSubscription> {
  const result = await payload.find({
    collection: 'newsletter-subscriptions',
    limit: 1,
    overrideAccess: true,
    where: { email: { equals: email } },
  })
  const subscription = result.docs[0]
  if (!subscription) throw new Error(`Missing newsletter subscription for ${email}`)
  createdSubscriptionIds.add(subscription.id)
  return subscription
}

async function removeTestRecords(): Promise<void> {
  if (!payload) return
  await payload.delete({
    collection: 'newsletter-request-limits',
    overrideAccess: true,
    where: { id: { exists: true } },
  })

  const subscriptions = await payload.find({
    collection: 'newsletter-subscriptions',
    limit: 100,
    overrideAccess: true,
    where: { email: { contains: testEmailSuffix } },
  })

  for (const subscription of subscriptions.docs) {
    createdSubscriptionIds.add(subscription.id)
  }

  const ids = Array.from(createdSubscriptionIds)
  if (ids.length > 0) {
    await payload.delete({
      collection: 'newsletter-consent-events',
      overrideAccess: true,
      where: { subscription: { in: ids } },
    })
    await payload.delete({
      collection: 'newsletter-subscriptions',
      overrideAccess: true,
      where: { id: { in: ids } },
    })
  }

  createdSubscriptionIds.clear()
}

async function createTestSubscription(
  data: Partial<NewsletterSubscription> & Pick<NewsletterSubscription, 'email' | 'status' | 'requestedAt'>,
): Promise<NewsletterSubscription> {
  const token = createOpaqueToken()
  const now = new Date()
  const subscription = await payload.create({
    collection: 'newsletter-subscriptions',
    data: {
      confirmationDeliveryAttempts: 0,
      confirmationDeliveryStatus: 'pending',
      confirmationExpiresAt: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
      confirmationSentAt: now.toISOString(),
      confirmationTokenHash: hashOpaqueToken(token),
      consentVersion: 'newsletter-consent-2026-09-02',
      generation: 1,
      privacyVersion: privacyVersionLabel,
      providerContactId: null,
      providerError: null,
      providerNextAttemptAt: null,
      providerOperationId: null,
      providerSyncAttempts: 0,
      providerSyncStatus: 'synced',
      purpose: 'newsletter_marketing',
      source: 'homepage-newsletter',
      suppressionReason: null,
      unsubscribeTokenCiphertext: null,
      unsubscribeTokenHash: null,
      welcomeDeliveryAttempts: 0,
      welcomeDeliveryStatus: 'pending',
      welcomeNextAttemptAt: null,
      welcomeOperationId: null,
      ...data,
    },
    overrideAccess: true,
  })
  createdSubscriptionIds.add(subscription.id)
  return subscription
}

async function requestAndDeliver(email: string): Promise<string> {
  const callsBefore = sendConfirmationEmail.mock.calls.length

  await expect(requestNewsletterSubscription(payload, email.toUpperCase())).resolves.toEqual({ status: 'accepted' })

  const pending = await findSubscription(email)
  expect(pending).toMatchObject({
    confirmationDeliveryStatus: 'pending',
    confirmationTokenHash: null,
    status: 'pending',
  })
  expect(sendConfirmationEmail).toHaveBeenCalledTimes(callsBefore)

  await runNewsletterMaintenance(payload)

  expect(sendConfirmationEmail).toHaveBeenCalledTimes(callsBefore + 1)
  const token = sendConfirmationEmail.mock.calls[callsBefore]?.[1]
  expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)

  const sent = await findSubscription(email)
  expect(sent.confirmationTokenHash).toBeTruthy()
  expect(sent.confirmationDeliveryStatus).toBe('sent')

  return token as string
}

beforeAll(async () => {
  process.env.NEWSLETTER_ENABLED = 'true'
  process.env.NEWSLETTER_WITHDRAWAL_REQUIRED = 'true'
  process.env.NEWSLETTER_SERVICE_SECRET = 'newsletter-service-secret'.repeat(2)
  process.env.NEWSLETTER_TOKEN_ENCRYPTION_KEY = validEncryptionKey()
  process.env.NEWSLETTER_PRIVACY_VERSION = privacyVersionLabel
  process.env.RESEND_API_KEY = 'resend-key'
  process.env.RESEND_AUDIENCE_ID = 'audience-id'
  payload = await getPayload({ config })
  adminUser = await createAdminUser()
  await ensurePrivacyDocument(adminUser)
})

afterEach(async () => {
  await removeTestRecords()
  vi.clearAllMocks()
})

afterAll(async () => {
  await removeTestRecords()
  if (privacyDocumentCreated && adminUser && payload) {
    const documentId = await findPublishedPrivacyDocument(privacyVersionLabel)
    if (documentId) {
      try {
        await payload.delete({
          collection: 'legal-documents',
          context: { disableRevalidate: true },
          id: documentId,
          overrideAccess: true,
        })
      } catch {
        // Best-effort cleanup; the document may already be gone.
      }
    }
  }
  if (adminUser && payload) {
    try {
      await payload.delete({
        collection: 'users',
        id: adminUser.id,
        overrideAccess: true,
      })
    } catch {
      // Best-effort cleanup.
    }
  }
  restoreEnv({
    NEWSLETTER_TOKEN_ENCRYPTION_KEY: initialEncryptionKey,
    NEWSLETTER_ENABLED: initialEnabled,
    NEWSLETTER_PRIVACY_VERSION: initialPrivacyVersion,
    NEWSLETTER_WITHDRAWAL_REQUIRED: initialWithdrawalRequired,
    NEWSLETTER_SERVICE_SECRET: initialServiceSecret,
    RESEND_API_KEY: initialResendApiKey,
    RESEND_AUDIENCE_ID: initialResendAudienceId,
  })
  await payload?.destroy?.()
})

describe('newsletter consent lifecycle', () => {
  it('keeps requests pending until the current inbox challenge is confirmed', async () => {
    const email = `pending-${crypto.randomUUID()}${testEmailSuffix}`
    sendConfirmationEmail.mockResolvedValue({ messageId: 'confirmation-message' })

    const confirmationToken = await requestAndDeliver(email)

    const subscription = await findSubscription(email)
    expect(subscription).toMatchObject({
      consentVersion: 'newsletter-consent-2026-09-02',
      generation: 1,
      privacyVersion: privacyVersionLabel,
      status: 'pending',
    })
    expect(subscription.confirmationTokenHash).toBeTruthy()
    expect(confirmationToken).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(activateProviderContact).not.toHaveBeenCalled()
    await expect(inspectNewsletterConfirmation(payload, confirmationToken)).resolves.toEqual({ valid: true })

    // Repeated request within the cooldown window must not trigger another email, even after maintenance.
    const callsBefore = sendConfirmationEmail.mock.calls.length
    await requestNewsletterSubscription(payload, email)
    await runNewsletterMaintenance(payload)
    expect(sendConfirmationEmail).toHaveBeenCalledTimes(callsBefore)
  })

  it('activates once, records evidence, and produces a durable withdrawal credential', async () => {
    const email = `confirm-${crypto.randomUUID()}${testEmailSuffix}`
    sendConfirmationEmail.mockResolvedValue({ messageId: 'confirmation-message' })
    activateProviderContact.mockResolvedValue({ contactId: 'contact-id' })
    sendWelcomeEmail.mockResolvedValue({ messageId: 'welcome-message' })

    const confirmationToken = await requestAndDeliver(email)
    await expect(confirmNewsletterSubscription(payload, confirmationToken)).resolves.toEqual({
      providerSynced: true,
      status: 'confirmed',
    })

    // Welcome delivery is performed asynchronously by maintenance, not synchronously by provider sync.
    await runNewsletterMaintenance(payload)

    const active = await findSubscription(email)
    const unsubscribeToken = sendWelcomeEmail.mock.calls[0]?.[1]
    expect(active).toMatchObject({
      confirmationTokenHash: null,
      providerContactId: 'contact-id',
      providerSyncStatus: 'synced',
      status: 'active',
      welcomeDeliveryStatus: 'sent',
    })
    expect(unsubscribeToken).toMatch(/^[A-Za-z0-9_-]{43}$/)
    await expect(inspectNewsletterConfirmation(payload, confirmationToken)).resolves.toEqual({ valid: false })
    await expect(inspectNewsletterUnsubscribe(payload, unsubscribeToken)).resolves.toEqual({ valid: true })

    const events = await payload.find({
      collection: 'newsletter-consent-events',
      limit: 20,
      overrideAccess: true,
      where: { subscription: { equals: active.id } },
    })
    expect(events.docs.map((event) => event.eventType)).toEqual(
      expect.arrayContaining([
        'signup_requested',
        'confirmation_sent',
        'consent_confirmed',
        'provider_synced',
        'welcome_sent',
      ]),
    )

    await requestNewsletterSubscription(payload, email)
    await runNewsletterMaintenance(payload)
    expect(sendConfirmationEmail).toHaveBeenCalledTimes(1)
    expect(activateProviderContact).toHaveBeenCalledTimes(1)
  })

  it('records withdrawal before provider sync and repeats it idempotently', async () => {
    const email = `unsubscribe-${crypto.randomUUID()}${testEmailSuffix}`
    sendConfirmationEmail.mockResolvedValue({ messageId: 'confirmation-message' })
    activateProviderContact.mockResolvedValue({ contactId: 'contact-id' })
    sendWelcomeEmail.mockResolvedValue({ messageId: 'welcome-message' })
    deactivateProviderContact.mockResolvedValue(undefined)

    const confirmationToken = await requestAndDeliver(email)
    await confirmNewsletterSubscription(payload, confirmationToken)
    await runNewsletterMaintenance(payload)
    const unsubscribeToken = sendWelcomeEmail.mock.calls[0]?.[1]

    await expect(unsubscribeNewsletterSubscription(payload, unsubscribeToken)).resolves.toEqual({
      providerSynced: true,
      status: 'unsubscribed',
    })
    await expect(unsubscribeNewsletterSubscription(payload, unsubscribeToken)).resolves.toEqual({
      providerSynced: true,
      status: 'unsubscribed',
    })

    expect(await findSubscription(email)).toMatchObject({
      providerSyncStatus: 'synced',
      status: 'unsubscribed',
      suppressionReason: 'user_unsubscribe',
    })
    expect(deactivateProviderContact).toHaveBeenCalledTimes(1)
  })

  it('requires a fresh generation after withdrawal and rejects stale confirmation', async () => {
    const email = `resubscribe-${crypto.randomUUID()}${testEmailSuffix}`
    sendConfirmationEmail.mockResolvedValue({ messageId: 'confirmation-message' })
    activateProviderContact.mockResolvedValue({ contactId: 'contact-id' })
    sendWelcomeEmail.mockResolvedValue({ messageId: 'welcome-message' })
    deactivateProviderContact.mockResolvedValue(undefined)

    const firstConfirmation = await requestAndDeliver(email)
    await confirmNewsletterSubscription(payload, firstConfirmation)
    await runNewsletterMaintenance(payload)
    const unsubscribeToken = sendWelcomeEmail.mock.calls[0]?.[1]
    await unsubscribeNewsletterSubscription(payload, unsubscribeToken)
    const secondConfirmation = await requestAndDeliver(email)

    const pending = await findSubscription(email)
    expect(pending).toMatchObject({ generation: 2, status: 'pending' })
    expect(secondConfirmation).not.toBe(firstConfirmation)
    await expect(confirmNewsletterSubscription(payload, firstConfirmation)).resolves.toBeNull()
    await expect(confirmNewsletterSubscription(payload, secondConfirmation)).resolves.toEqual({
      providerSynced: true,
      status: 'confirmed',
    })
  })

  it('never sends or activates a suppressed address', async () => {
    const email = `suppressed-${crypto.randomUUID()}${testEmailSuffix}`
    await payload.create({
      collection: 'newsletter-subscriptions',
      data: {
        confirmationDeliveryAttempts: 0,
        confirmationDeliveryStatus: 'pending',
        consentVersion: 'newsletter-consent-2026-09-02',
        email,
        generation: 1,
        privacyVersion: privacyVersionLabel,
        providerSyncStatus: 'synced',
        providerSyncAttempts: 0,
        purpose: 'newsletter_marketing',
        requestedAt: new Date().toISOString(),
        source: 'homepage-newsletter',
        status: 'suppressed',
        suppressionReason: 'complaint',
        welcomeDeliveryAttempts: 0,
        welcomeDeliveryStatus: 'pending',
      },
      overrideAccess: true,
    })

    await expect(requestNewsletterSubscription(payload, email)).resolves.toEqual({ status: 'accepted' })
    await runNewsletterMaintenance(payload)
    expect(sendConfirmationEmail).not.toHaveBeenCalled()
    expect(activateProviderContact).not.toHaveBeenCalled()
  })

  it('returns neutral accepted without creating a subscription when the privacy notice does not match', async () => {
    const saved = saveEnv(['NEWSLETTER_PRIVACY_VERSION'])
    process.env.NEWSLETTER_PRIVACY_VERSION = 'nonexistent-privacy-version'
    try {
      const email = `mismatch-${crypto.randomUUID()}${testEmailSuffix}`
      sendConfirmationEmail.mockResolvedValue({ messageId: 'confirmation-message' })

      await expect(requestNewsletterSubscription(payload, email)).resolves.toEqual({ status: 'accepted' })
      await runNewsletterMaintenance(payload)

      expect(sendConfirmationEmail).not.toHaveBeenCalled()
      const result = await payload.find({
        collection: 'newsletter-subscriptions',
        limit: 1,
        overrideAccess: true,
        where: { email: { equals: email } },
      })
      expect(result.docs).toHaveLength(0)
    } finally {
      restoreEnv(saved)
    }
  })
})

describe('newsletter maintenance', () => {
  it('retries a failed provider activation during maintenance and then sends welcome', async () => {
    const saved = saveEnv(['CRON_SECRET', 'NEWSLETTER_ENABLED'])
    process.env.CRON_SECRET = 'newsletter-maintenance-test-secret'
    process.env.NEWSLETTER_ENABLED = 'true'
    try {
      const email = `provider-fail-${crypto.randomUUID()}${testEmailSuffix}`
      sendConfirmationEmail.mockResolvedValue({ messageId: 'confirmation-message' })
      activateProviderContact.mockRejectedValueOnce(new Error('provider down'))
      activateProviderContact.mockRejectedValueOnce(new Error('provider down'))
      activateProviderContact.mockResolvedValue({ contactId: 'contact-id' })
      sendWelcomeEmail.mockResolvedValue({ messageId: 'welcome-message' })

      const confirmationToken = await requestAndDeliver(email)
      await expect(confirmNewsletterSubscription(payload, confirmationToken)).resolves.toEqual({
        providerSynced: false,
        status: 'confirmed',
      })

      const afterConfirm = await findSubscription(email)
      expect(afterConfirm).toMatchObject({
        providerContactId: null,
        providerSyncStatus: 'failed',
        status: 'active',
      })
      expect(afterConfirm.providerError).toContain('provider down')
      expect(afterConfirm.providerNextAttemptAt).toBeTruthy()
      expect(afterConfirm.providerOperationId).toBeTruthy()

      await payload.update({
        collection: 'newsletter-subscriptions',
        data: { providerNextAttemptAt: new Date(Date.now() - 1000).toISOString() },
        limit: 1,
        overrideAccess: true,
        where: { id: { equals: afterConfirm.id } },
      })

      const failedResult = await runNewsletterMaintenance(payload)
      expect(failedResult.providerRetries).toBeGreaterThanOrEqual(1)
      expect(failedResult.providerFailures).toBeGreaterThanOrEqual(1)
      expect(failedResult.failedDeliveries).toBeGreaterThanOrEqual(1)

      const unhealthyResponse = await runMaintenanceRoute(
        new Request('http://localhost/api/newsletter/maintenance', {
          headers: { authorization: 'Bearer newsletter-maintenance-test-secret' },
          method: 'POST',
        }),
      )
      expect(unhealthyResponse.status).toBe(503)

      const stillFailed = await findSubscription(email)
      expect(stillFailed).toMatchObject({
        providerContactId: null,
        providerSyncStatus: 'failed',
        status: 'active',
      })

      await payload.update({
        collection: 'newsletter-subscriptions',
        data: { providerNextAttemptAt: new Date(Date.now() - 1000).toISOString() },
        limit: 1,
        overrideAccess: true,
        where: { id: { equals: stillFailed.id } },
      })

      const retryResult = await runNewsletterMaintenance(payload)
      expect(retryResult.providerRetries).toBeGreaterThanOrEqual(1)
      expect(retryResult.providerFailures).toBe(0)
      expect(retryResult.failedDeliveries).toBe(0)

      const active = await findSubscription(email)
      expect(active).toMatchObject({
        providerContactId: 'contact-id',
        providerError: null,
        providerSyncStatus: 'synced',
        status: 'active',
      })

      // Welcome is queued in a separate maintenance run after provider sync succeeds.
      await runNewsletterMaintenance(payload)

      const afterWelcome = await findSubscription(email)
      expect(afterWelcome).toMatchObject({ welcomeDeliveryStatus: 'sent' })
      expect(afterWelcome.welcomeSentAt).toBeTruthy()
      expect(sendWelcomeEmail).toHaveBeenCalledTimes(1)

      const healthyResponse = await runMaintenanceRoute(
        new Request('http://localhost/api/newsletter/maintenance', {
          headers: { authorization: 'Bearer newsletter-maintenance-test-secret' },
          method: 'POST',
        }),
      )
      expect(healthyResponse.status).toBe(200)

      const events = await payload.find({
        collection: 'newsletter-consent-events',
        limit: 20,
        overrideAccess: true,
        where: { subscription: { equals: active.id } },
      })
      expect(events.docs.map((event) => event.eventType)).toEqual(
        expect.arrayContaining(['provider_sync_failed', 'provider_synced', 'welcome_sent']),
      )
    } finally {
      restoreEnv(saved)
    }
  })

  it('expires pending subscriptions older than 30 days and clears sensitive identifiers', async () => {
    const originalEmail = `expired-${crypto.randomUUID()}${testEmailSuffix}`
    const requestedAt = new Date(Date.now() - PENDING_RETENTION_MS - 1000).toISOString()
    const subscription = await createTestSubscription({
      confirmationDeliveryStatus: 'sent',
      confirmationNextAttemptAt: null,
      email: originalEmail,
      requestedAt,
      status: 'pending',
    })

    const result = await runNewsletterMaintenance(payload)
    expect(result.expiredPending).toBe(1)

    const expired = await payload.findByID({
      collection: 'newsletter-subscriptions',
      id: subscription.id,
      overrideAccess: true,
    })
    expect(expired.status).toBe('expired')
    expect(expired.email).not.toBe(originalEmail)
    expect(expired.email).not.toContain(testEmailSuffix)
    expect(expired.confirmationTokenHash).toBeNull()
    expect(expired.confirmationExpiresAt).toBeNull()
    expect(expired.confirmationNextAttemptAt).toBeNull()
    expect(expired.unsubscribeTokenCiphertext).toBeNull()
    expect(expired.unsubscribeTokenHash).toBeNull()
    expect(expired.providerContactId).toBeNull()
    expect(expired.providerOperationId).toBeNull()
    expect(expired.providerError).toBeNull()
    expect(expired.providerNextAttemptAt).toBeNull()
    expect(expired.providerSyncStatus).toBe('synced')

    const events = await payload.find({
      collection: 'newsletter-consent-events',
      limit: 10,
      overrideAccess: true,
      where: { subscription: { equals: subscription.id }, eventType: { equals: 'pending_expired' } },
    })
    expect(events.docs).toHaveLength(1)
  })

  it('does not resend confirmations or activate active subscriptions when disabled, but retries unsubscribed deactivation', async () => {
    const saved = saveEnv(['NEWSLETTER_ENABLED'])
    process.env.NEWSLETTER_ENABLED = 'false'
    try {
      const pendingEmail = `disabled-pending-${crypto.randomUUID()}${testEmailSuffix}`
      const activeEmail = `disabled-active-${crypto.randomUUID()}${testEmailSuffix}`
      const unsubscribedEmail = `disabled-unsubscribed-${crypto.randomUUID()}${testEmailSuffix}`

      const pending = await createTestSubscription({
        confirmationDeliveryAttempts: 1,
        confirmationDeliveryStatus: 'failed',
        confirmationNextAttemptAt: new Date(Date.now() - 1000).toISOString(),
        email: pendingEmail,
        requestedAt: new Date().toISOString(),
        status: 'pending',
      })
      const active = await createTestSubscription({
        email: activeEmail,
        providerOperationId: crypto.randomUUID(),
        providerSyncStatus: 'pending',
        providerNextAttemptAt: new Date(Date.now() - 1000).toISOString(),
        requestedAt: new Date().toISOString(),
        status: 'active',
      })
      const unsubscribed = await createTestSubscription({
        email: unsubscribedEmail,
        providerOperationId: crypto.randomUUID(),
        providerSyncStatus: 'pending',
        providerNextAttemptAt: new Date(Date.now() - 1000).toISOString(),
        requestedAt: new Date().toISOString(),
        status: 'unsubscribed',
        suppressionReason: 'user_unsubscribe',
      })

      deactivateProviderContact.mockResolvedValue(undefined)
      sendConfirmationEmail.mockResolvedValue({ messageId: 'confirmation-message' })
      activateProviderContact.mockResolvedValue({ contactId: 'contact-id' })

      const result = await runNewsletterMaintenance(payload)

      expect(sendConfirmationEmail).not.toHaveBeenCalled()
      expect(activateProviderContact).not.toHaveBeenCalled()
      expect(deactivateProviderContact).toHaveBeenCalledTimes(1)
      expect(deactivateProviderContact).toHaveBeenCalledWith(unsubscribed.email)

      const pendingAfter = await payload.findByID({
        collection: 'newsletter-subscriptions',
        id: pending.id,
        overrideAccess: true,
      })
      expect(pendingAfter).toMatchObject({ confirmationDeliveryStatus: 'failed', status: 'pending' })

      const activeAfter = await payload.findByID({
        collection: 'newsletter-subscriptions',
        id: active.id,
        overrideAccess: true,
      })
      expect(activeAfter).toMatchObject({ providerSyncStatus: 'pending', status: 'active' })

      const unsubscribedAfter = await payload.findByID({
        collection: 'newsletter-subscriptions',
        id: unsubscribed.id,
        overrideAccess: true,
      })
      expect(unsubscribedAfter).toMatchObject({ providerSyncStatus: 'synced', status: 'unsubscribed' })

      expect(result.confirmationRetries).toBe(0)
      expect(result.welcomeRetries).toBe(0)
      expect(result.providerRetries).toBe(1)
    } finally {
      restoreEnv(saved)
    }
  })
})

describe('newsletter configuration validation', () => {
  it('reports no error when the feature is disabled and withdrawal is not required', () => {
    const saved = saveEnv([
      'NEWSLETTER_ENABLED',
      'NEWSLETTER_WITHDRAWAL_REQUIRED',
      'NEWSLETTER_SERVICE_SECRET',
      'NEWSLETTER_TOKEN_ENCRYPTION_KEY',
      'NEWSLETTER_PRIVACY_VERSION',
      'RESEND_API_KEY',
      'RESEND_AUDIENCE_ID',
    ])
    process.env.NEWSLETTER_ENABLED = 'false'
    process.env.NEWSLETTER_WITHDRAWAL_REQUIRED = 'false'
    delete process.env.NEWSLETTER_SERVICE_SECRET
    delete process.env.NEWSLETTER_TOKEN_ENCRYPTION_KEY
    delete process.env.RESEND_API_KEY
    delete process.env.RESEND_AUDIENCE_ID
    try {
      expect(getNewsletterConfigurationError()).toBeNull()
    } finally {
      restoreEnv(saved)
    }
  })

  it('reports no error when enabled with a valid configuration', () => {
    const saved = saveEnv([
      'NEWSLETTER_ENABLED',
      'NEWSLETTER_WITHDRAWAL_REQUIRED',
      'NEWSLETTER_SERVICE_SECRET',
      'NEWSLETTER_TOKEN_ENCRYPTION_KEY',
      'NEWSLETTER_PRIVACY_VERSION',
      'RESEND_API_KEY',
      'RESEND_AUDIENCE_ID',
    ])
    process.env.NEWSLETTER_ENABLED = 'true'
    process.env.NEWSLETTER_WITHDRAWAL_REQUIRED = 'false'
    process.env.NEWSLETTER_SERVICE_SECRET = 'a'.repeat(32)
    process.env.NEWSLETTER_TOKEN_ENCRYPTION_KEY = validEncryptionKey()
    process.env.NEWSLETTER_PRIVACY_VERSION = 'privacy-approved-v1'
    process.env.RESEND_API_KEY = 'resend-key'
    process.env.RESEND_AUDIENCE_ID = 'audience-id'
    try {
      expect(getNewsletterConfigurationError()).toBeNull()
    } finally {
      restoreEnv(saved)
    }
  })

  it('reports an error when enabled with a short service secret', () => {
    const saved = saveEnv([
      'NEWSLETTER_ENABLED',
      'NEWSLETTER_WITHDRAWAL_REQUIRED',
      'NEWSLETTER_SERVICE_SECRET',
      'NEWSLETTER_TOKEN_ENCRYPTION_KEY',
      'RESEND_API_KEY',
      'RESEND_AUDIENCE_ID',
    ])
    process.env.NEWSLETTER_ENABLED = 'true'
    process.env.NEWSLETTER_WITHDRAWAL_REQUIRED = 'false'
    process.env.NEWSLETTER_SERVICE_SECRET = 'short'
    process.env.NEWSLETTER_TOKEN_ENCRYPTION_KEY = validEncryptionKey()
    process.env.RESEND_API_KEY = 'resend-key'
    process.env.RESEND_AUDIENCE_ID = 'audience-id'
    try {
      expect(getNewsletterConfigurationError()).toContain('NEWSLETTER_SERVICE_SECRET')
    } finally {
      restoreEnv(saved)
    }
  })

  it('reports an error when enabled with an invalid encryption key', () => {
    const saved = saveEnv([
      'NEWSLETTER_ENABLED',
      'NEWSLETTER_WITHDRAWAL_REQUIRED',
      'NEWSLETTER_SERVICE_SECRET',
      'NEWSLETTER_TOKEN_ENCRYPTION_KEY',
      'RESEND_API_KEY',
      'RESEND_AUDIENCE_ID',
    ])
    process.env.NEWSLETTER_ENABLED = 'true'
    process.env.NEWSLETTER_WITHDRAWAL_REQUIRED = 'false'
    process.env.NEWSLETTER_SERVICE_SECRET = 'a'.repeat(32)
    process.env.NEWSLETTER_TOKEN_ENCRYPTION_KEY = 'not-valid'
    process.env.RESEND_API_KEY = 'resend-key'
    process.env.RESEND_AUDIENCE_ID = 'audience-id'
    try {
      expect(getNewsletterConfigurationError()).toContain('NEWSLETTER_TOKEN_ENCRYPTION_KEY')
    } finally {
      restoreEnv(saved)
    }
  })

  it('reports an error when enabled without Resend credentials', () => {
    const saved = saveEnv([
      'NEWSLETTER_ENABLED',
      'NEWSLETTER_WITHDRAWAL_REQUIRED',
      'NEWSLETTER_SERVICE_SECRET',
      'NEWSLETTER_TOKEN_ENCRYPTION_KEY',
      'RESEND_API_KEY',
      'RESEND_AUDIENCE_ID',
    ])
    process.env.NEWSLETTER_ENABLED = 'true'
    process.env.NEWSLETTER_WITHDRAWAL_REQUIRED = 'false'
    process.env.NEWSLETTER_SERVICE_SECRET = 'a'.repeat(32)
    process.env.NEWSLETTER_TOKEN_ENCRYPTION_KEY = validEncryptionKey()
    delete process.env.RESEND_API_KEY
    delete process.env.RESEND_AUDIENCE_ID
    try {
      const error = getNewsletterConfigurationError()
      expect(error).toContain('RESEND_API_KEY')
      expect(error).toContain('RESEND_AUDIENCE_ID')
    } finally {
      restoreEnv(saved)
    }
  })

  it('reports an error when enabled without an approved privacy notice version', () => {
    const saved = saveEnv([
      'NEWSLETTER_ENABLED',
      'NEWSLETTER_WITHDRAWAL_REQUIRED',
      'NEWSLETTER_SERVICE_SECRET',
      'NEWSLETTER_TOKEN_ENCRYPTION_KEY',
      'NEWSLETTER_PRIVACY_VERSION',
      'RESEND_API_KEY',
      'RESEND_AUDIENCE_ID',
    ])
    process.env.NEWSLETTER_ENABLED = 'true'
    process.env.NEWSLETTER_WITHDRAWAL_REQUIRED = 'false'
    process.env.NEWSLETTER_SERVICE_SECRET = 'a'.repeat(32)
    process.env.NEWSLETTER_TOKEN_ENCRYPTION_KEY = validEncryptionKey()
    delete process.env.NEWSLETTER_PRIVACY_VERSION
    process.env.RESEND_API_KEY = 'resend-key'
    process.env.RESEND_AUDIENCE_ID = 'audience-id'
    try {
      expect(getNewsletterConfigurationError()).toContain('NEWSLETTER_PRIVACY_VERSION')
    } finally {
      restoreEnv(saved)
    }
  })

  it('reports an error when withdrawal is required but service secret or Resend credentials are missing', () => {
    const saved = saveEnv([
      'NEWSLETTER_ENABLED',
      'NEWSLETTER_WITHDRAWAL_REQUIRED',
      'NEWSLETTER_SERVICE_SECRET',
      'NEWSLETTER_TOKEN_ENCRYPTION_KEY',
      'NEWSLETTER_PRIVACY_VERSION',
      'RESEND_API_KEY',
      'RESEND_AUDIENCE_ID',
    ])
    process.env.NEWSLETTER_ENABLED = 'false'
    process.env.NEWSLETTER_WITHDRAWAL_REQUIRED = 'true'
    delete process.env.NEWSLETTER_SERVICE_SECRET
    delete process.env.NEWSLETTER_TOKEN_ENCRYPTION_KEY
    delete process.env.NEWSLETTER_PRIVACY_VERSION
    delete process.env.RESEND_API_KEY
    delete process.env.RESEND_AUDIENCE_ID
    try {
      const missingSecretError = getNewsletterConfigurationError()
      expect(missingSecretError).toContain('NEWSLETTER_SERVICE_SECRET')

      process.env.NEWSLETTER_SERVICE_SECRET = 'a'.repeat(32)
      const missingResendError = getNewsletterConfigurationError()
      expect(missingResendError).toContain('RESEND_API_KEY')
      expect(missingResendError).toContain('RESEND_AUDIENCE_ID')
    } finally {
      restoreEnv(saved)
    }
  })

  it('reports no error when withdrawal is required with valid service and Resend credentials', () => {
    const saved = saveEnv([
      'NEWSLETTER_ENABLED',
      'NEWSLETTER_WITHDRAWAL_REQUIRED',
      'NEWSLETTER_SERVICE_SECRET',
      'NEWSLETTER_TOKEN_ENCRYPTION_KEY',
      'NEWSLETTER_PRIVACY_VERSION',
      'RESEND_API_KEY',
      'RESEND_AUDIENCE_ID',
    ])
    process.env.NEWSLETTER_ENABLED = 'false'
    process.env.NEWSLETTER_WITHDRAWAL_REQUIRED = 'true'
    process.env.NEWSLETTER_SERVICE_SECRET = 'a'.repeat(32)
    delete process.env.NEWSLETTER_TOKEN_ENCRYPTION_KEY
    delete process.env.NEWSLETTER_PRIVACY_VERSION
    process.env.RESEND_API_KEY = 'resend-key'
    process.env.RESEND_AUDIENCE_ID = 'audience-id'
    try {
      expect(getNewsletterConfigurationError()).toBeNull()
    } finally {
      restoreEnv(saved)
    }
  })
})

describe('newsletter request throttling', () => {
  it('allows five requests per requester and time bucket without storing the requester', async () => {
    const saved = saveEnv(['NEWSLETTER_SERVICE_SECRET'])
    process.env.NEWSLETTER_SERVICE_SECRET = 'rate-limit-secret'.repeat(2)
    const now = new Date('2026-09-03T09:00:00.000Z')
    try {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        await expect(consumeNewsletterRequestLimit(payload, '203.0.113.8', now.getTime())).resolves.toBe(true)
      }
      await expect(consumeNewsletterRequestLimit(payload, '203.0.113.8', now.getTime())).resolves.toBe(false)
      await expect(
        consumeNewsletterRequestLimit(payload, '203.0.113.8', now.getTime() + 15 * 60 * 1000),
      ).resolves.toBe(true)

      const limits = await payload.find({
        collection: 'newsletter-request-limits',
        limit: 20,
        overrideAccess: true,
      })
      expect(limits.totalDocs).toBe(6)
      expect(JSON.stringify(limits.docs)).not.toContain('203.0.113.8')
    } finally {
      restoreEnv(saved)
    }
  })

  it('removes expired request-limit rows during maintenance', async () => {
    await payload.create({
      collection: 'newsletter-request-limits',
      data: { expiresAt: new Date(Date.now() - 1000).toISOString(), key: crypto.randomBytes(32).toString('hex') },
      overrideAccess: true,
    })

    const result = await runNewsletterMaintenance(payload)
    expect(result.deletedRequestLimits).toBe(1)
  })
})

describe('newsletter maintenance request authentication', () => {
  it('accepts a request with the correct bearer token', () => {
    const saved = saveEnv(['CRON_SECRET'])
    process.env.CRON_SECRET = 'cron-secret'
    try {
      const request = new Request('http://localhost/api/newsletter/maintenance', {
        headers: { authorization: 'Bearer cron-secret' },
      })
      expect(isNewsletterMaintenanceRequest(request)).toBe(true)
    } finally {
      restoreEnv(saved)
    }
  })

  it('rejects a request with an incorrect bearer token', () => {
    const saved = saveEnv(['CRON_SECRET'])
    process.env.CRON_SECRET = 'cron-secret'
    try {
      const request = new Request('http://localhost/api/newsletter/maintenance', {
        headers: { authorization: 'Bearer wrong-secret' },
      })
      expect(isNewsletterMaintenanceRequest(request)).toBe(false)
    } finally {
      restoreEnv(saved)
    }
  })

  it('rejects a request when no cron secret is configured', () => {
    const saved = saveEnv(['CRON_SECRET'])
    process.env.CRON_SECRET = ''
    try {
      const request = new Request('http://localhost/api/newsletter/maintenance', {
        headers: { authorization: 'Bearer cron-secret' },
      })
      expect(isNewsletterMaintenanceRequest(request)).toBe(false)
    } finally {
      restoreEnv(saved)
    }
  })
})
