import { randomUUID } from 'node:crypto'
import type { Payload } from 'payload'

import type { NewsletterSubscription } from '@/payload-types'

import { newsletterAuditContext } from './audit'
import {
  CONFIRMATION_COOLDOWN_MS,
  CONFIRMATION_TTL_MS,
  getNewsletterPrivacyVersion,
  NEWSLETTER_CONSENT_VERSION,
  NEWSLETTER_PURPOSE,
  NEWSLETTER_SOURCE,
  PENDING_RETENTION_MS,
  PROVIDER_LEASE_MS,
  REQUEST_LIMIT_MAX,
  REQUEST_LIMIT_RETENTION_MS,
  REQUEST_LIMIT_WINDOW_MS,
  RETRY_BASE_MS,
  RETRY_MAX_MS,
  isNewsletterEnabled,
} from './constants'
import { activateProviderContact, deactivateProviderContact, sendConfirmationEmail, sendWelcomeEmail } from './resend'
import {
  createOpaqueToken,
  decryptOpaqueToken,
  encryptOpaqueToken,
  hashNewsletterRequester,
  hashOpaqueToken,
  isOpaqueToken,
} from './security'

export type NewsletterInspection = { valid: boolean }

export type NewsletterMutationResult = {
  providerSynced?: boolean
  status: 'accepted' | 'confirmed' | 'unsubscribed'
}

export type NewsletterMaintenanceResult = {
  confirmationFailures: number
  confirmationRetries: number
  deletedRequestLimits: number
  expiredPending: number
  failedDeliveries: number
  providerFailures: number
  providerRetries: number
  remainingDue: number
  welcomeFailures: number
  welcomeRetries: number
}

const normalizeEmail = (email: string): string => email.trim().toLowerCase()

export const consumeNewsletterRequestLimit = async (
  payload: Payload,
  requester: string,
  now = Date.now(),
): Promise<boolean> => {
  const bucket = Math.floor(now / REQUEST_LIMIT_WINDOW_MS)
  const expiresAt = new Date((bucket + 1) * REQUEST_LIMIT_WINDOW_MS + REQUEST_LIMIT_RETENTION_MS).toISOString()
  const normalizedRequester = requester.trim().slice(0, 200) || 'unknown'

  for (let slot = 0; slot < REQUEST_LIMIT_MAX; slot += 1) {
    const key = hashNewsletterRequester(`${bucket}:${slot}:${normalizedRequester}`)
    try {
      await payload.create({
        collection: 'newsletter-request-limits',
        data: { expiresAt, key },
        overrideAccess: true,
      })
      return true
    } catch (error) {
      const existing = await payload.find({
        collection: 'newsletter-request-limits',
        limit: 1,
        overrideAccess: true,
        where: { key: { equals: key } },
      })
      if (existing.docs.length === 0) throw error
    }
  }

  return false
}

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message.slice(0, 500) : 'Unknown newsletter provider error'

const retryAt = (attempt: number): string =>
  new Date(Date.now() + Math.min(RETRY_BASE_MS * 2 ** Math.max(0, attempt - 1), RETRY_MAX_MS)).toISOString()

const leaseUntil = (): string => new Date(Date.now() + PROVIDER_LEASE_MS).toISOString()

const findSubscriptionByEmail = async (payload: Payload, email: string): Promise<NewsletterSubscription | null> => {
  const result = await payload.find({
    collection: 'newsletter-subscriptions',
    limit: 1,
    overrideAccess: true,
    where: { email: { equals: email } },
  })
  return result.docs[0] ?? null
}

const hasMatchingPublishedPrivacyNotice = async (payload: Payload): Promise<boolean> => {
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
        { versionLabel: { equals: getNewsletterPrivacyVersion() } },
      ],
    },
  })
  return result.docs.length === 1
}

const findSubscriptionByID = async (
  payload: Payload,
  id: NewsletterSubscription['id'],
): Promise<NewsletterSubscription | null> => {
  try {
    return await payload.findByID({ collection: 'newsletter-subscriptions', id, overrideAccess: true })
  } catch {
    return null
  }
}

const findSubscriptionByToken = async (
  payload: Payload,
  field: 'confirmationTokenHash' | 'unsubscribeTokenHash',
  token: string,
): Promise<NewsletterSubscription | null> => {
  if (!isOpaqueToken(token)) return null
  const result = await payload.find({
    collection: 'newsletter-subscriptions',
    limit: 1,
    overrideAccess: true,
    where: { [field]: { equals: hashOpaqueToken(token) } },
  })
  return result.docs[0] ?? null
}

const logProviderError = (payload: Payload, error: unknown, message: string): void => {
  payload.logger.error({ err: error, msg: message })
}

const deliverConfirmation = async (
  payload: Payload,
  subscription: NewsletterSubscription,
  token: string,
): Promise<boolean> => {
  const attempt = subscription.confirmationDeliveryAttempts + 1
  const tokenHash = hashOpaqueToken(token)

  try {
    const { messageId } = await sendConfirmationEmail(subscription.email, token)
    const result = await payload.update({
      collection: 'newsletter-subscriptions',
      context: newsletterAuditContext({
        eventKey: `${subscription.id}:${subscription.generation}:confirmation_sent:${randomUUID()}`,
        eventType: 'confirmation_sent',
        providerMessageId: messageId,
      }),
      data: {
        confirmationDeliveryAttempts: attempt,
        confirmationDeliveryStatus: 'sent',
        confirmationNextAttemptAt: null,
      },
      limit: 1,
      overrideAccess: true,
      where: {
        and: [
          { id: { equals: subscription.id } },
          { confirmationTokenHash: { equals: tokenHash } },
          { status: { equals: 'pending' } },
        ],
      },
    })
    return result.docs.length === 1
  } catch (error) {
    await payload.update({
      collection: 'newsletter-subscriptions',
      context: newsletterAuditContext({
        eventKey: `${subscription.id}:${subscription.generation}:confirmation_delivery_failed:${randomUUID()}`,
        eventType: 'confirmation_delivery_failed',
      }),
      data: {
        confirmationDeliveryAttempts: attempt,
        confirmationDeliveryStatus: 'failed',
        confirmationNextAttemptAt: retryAt(attempt),
      },
      limit: 1,
      overrideAccess: true,
      where: {
        and: [
          { id: { equals: subscription.id } },
          { confirmationTokenHash: { equals: tokenHash } },
          { status: { equals: 'pending' } },
        ],
      },
    })
    logProviderError(payload, error, 'Newsletter confirmation email delivery failed.')
    return false
  }
}

const recordProviderFailure = async (
  payload: Payload,
  subscription: NewsletterSubscription,
  error: unknown,
): Promise<void> => {
  await payload.update({
    collection: 'newsletter-subscriptions',
    context: newsletterAuditContext({
      eventKey: `${subscription.id}:${subscription.generation}:provider_sync_failed:${randomUUID()}`,
      eventType: 'provider_sync_failed',
    }),
    data: {
      providerError: errorMessage(error),
      providerNextAttemptAt: retryAt(subscription.providerSyncAttempts),
      providerSyncStatus: 'failed',
    },
    limit: 1,
    overrideAccess: true,
    where: {
      and: [
        { id: { equals: subscription.id } },
        { providerOperationId: { equals: subscription.providerOperationId } },
        { providerSyncStatus: { equals: 'syncing' } },
        { status: { equals: subscription.status } },
      ],
    },
  })
  logProviderError(payload, error, 'Newsletter provider synchronization failed.')
}

const deliverWelcome = async (payload: Payload, subscription: NewsletterSubscription): Promise<boolean> => {
  if (
    subscription.status !== 'active' ||
    subscription.providerSyncStatus !== 'synced' ||
    subscription.welcomeDeliveryStatus === 'sent' ||
    !subscription.unsubscribeTokenCiphertext
  ) {
    return subscription.welcomeDeliveryStatus === 'sent'
  }

  const operationId = randomUUID()
  const claim = await payload.update({
    collection: 'newsletter-subscriptions',
    data: {
      welcomeDeliveryAttempts: subscription.welcomeDeliveryAttempts + 1,
      welcomeDeliveryStatus: 'sending',
      welcomeNextAttemptAt: leaseUntil(),
      welcomeOperationId: operationId,
    },
    limit: 1,
    overrideAccess: true,
    where: {
      and: [
        { id: { equals: subscription.id } },
        { providerSyncStatus: { equals: 'synced' } },
        { status: { equals: 'active' } },
        { updatedAt: { equals: subscription.updatedAt } },
      ],
    },
  })
  const claimed = claim.docs[0]
  if (!claimed) return false

  try {
    const token = decryptOpaqueToken(claimed.unsubscribeTokenCiphertext ?? '')
    const { messageId } = await sendWelcomeEmail(claimed.email, token)
    const result = await payload.update({
      collection: 'newsletter-subscriptions',
      context: newsletterAuditContext({
        eventKey: `${claimed.id}:${claimed.generation}:welcome_sent`,
        eventType: 'welcome_sent',
        providerMessageId: messageId,
      }),
      data: {
        welcomeDeliveryStatus: 'sent',
        welcomeNextAttemptAt: null,
        welcomeSentAt: new Date().toISOString(),
      },
      limit: 1,
      overrideAccess: true,
      where: {
        and: [
          { id: { equals: claimed.id } },
          { status: { equals: 'active' } },
          { welcomeOperationId: { equals: operationId } },
        ],
      },
    })
    return result.docs.length === 1
  } catch (error) {
    await payload.update({
      collection: 'newsletter-subscriptions',
      context: newsletterAuditContext({
        eventKey: `${claimed.id}:${claimed.generation}:welcome_delivery_failed:${randomUUID()}`,
        eventType: 'welcome_delivery_failed',
      }),
      data: {
        welcomeDeliveryStatus: 'failed',
        welcomeNextAttemptAt: retryAt(claimed.welcomeDeliveryAttempts),
      },
      limit: 1,
      overrideAccess: true,
      where: {
        and: [
          { id: { equals: claimed.id } },
          { welcomeOperationId: { equals: operationId } },
        ],
      },
    })
    logProviderError(payload, error, 'Newsletter welcome email delivery failed.')
    return false
  }
}

const syncProvider = async (
  payload: Payload,
  subscription: NewsletterSubscription,
  reconcileAfterRace = true,
): Promise<boolean> => {
  if (subscription.providerSyncStatus === 'synced') {
    return true
  }
  if (!['active', 'unsubscribed'].includes(subscription.status) || !subscription.providerOperationId) return false

  const claim = await payload.update({
    collection: 'newsletter-subscriptions',
    data: {
      providerNextAttemptAt: leaseUntil(),
      providerSyncAttempts: subscription.providerSyncAttempts + 1,
      providerSyncStatus: 'syncing',
    },
    limit: 1,
    overrideAccess: true,
    where: {
      and: [
        { id: { equals: subscription.id } },
        { providerOperationId: { equals: subscription.providerOperationId } },
        { providerSyncStatus: { equals: subscription.providerSyncStatus } },
        { status: { equals: subscription.status } },
        { updatedAt: { equals: subscription.updatedAt } },
      ],
    },
  })
  const claimed = claim.docs[0]
  if (!claimed) return false

  try {
    const providerResult =
      claimed.status === 'active'
        ? await activateProviderContact(claimed.email)
        : (await deactivateProviderContact(claimed.email), {})
    const result = await payload.update({
      collection: 'newsletter-subscriptions',
      context: newsletterAuditContext({
        eventKey: `${claimed.id}:${claimed.generation}:provider_synced:${randomUUID()}`,
        eventType: 'provider_synced',
      }),
      data: {
        providerContactId: providerResult.contactId ?? claimed.providerContactId,
        providerError: null,
        providerNextAttemptAt: null,
        providerSyncStatus: 'synced',
      },
      limit: 1,
      overrideAccess: true,
      where: {
        and: [
          { id: { equals: claimed.id } },
          { providerOperationId: { equals: claimed.providerOperationId } },
          { providerSyncStatus: { equals: 'syncing' } },
          { status: { equals: claimed.status } },
        ],
      },
    })
    const synced = result.docs[0]
    if (synced) return true

    if (reconcileAfterRace) {
      const latest = await findSubscriptionByID(payload, claimed.id)
      if (latest && latest.providerSyncStatus !== 'synced') return syncProvider(payload, latest, false)
    }
    return false
  } catch (error) {
    await recordProviderFailure(payload, claimed, error)
    return false
  }
}

export const requestNewsletterSubscription = async (
  payload: Payload,
  rawEmail: string,
): Promise<NewsletterMutationResult> => {
  const email = normalizeEmail(rawEmail)
  const [existing, hasApprovedNotice] = await Promise.all([
    findSubscriptionByEmail(payload, email),
    hasMatchingPublishedPrivacyNotice(payload),
  ])
  const now = new Date()

  if (!hasApprovedNotice) return { status: 'accepted' }

  if (existing?.status === 'active' || existing?.status === 'suppressed') return { status: 'accepted' }
  if (
    existing?.status === 'pending' &&
    now.getTime() - new Date(existing.requestedAt).getTime() < CONFIRMATION_COOLDOWN_MS
  ) {
    return { status: 'accepted' }
  }

  const generation = existing?.status === 'unsubscribed' ? existing.generation + 1 : (existing?.generation ?? 1)
  const commonData = {
    confirmationDeliveryAttempts: existing?.status === 'pending' ? existing.confirmationDeliveryAttempts : 0,
    confirmationDeliveryStatus: 'pending' as const,
    confirmationExpiresAt: null,
    confirmationNextAttemptAt: now.toISOString(),
    confirmationSentAt: null,
    confirmationTokenHash: null,
    confirmedAt: null,
    consentVersion: NEWSLETTER_CONSENT_VERSION,
    generation,
    privacyVersion: getNewsletterPrivacyVersion(),
    providerContactId: null,
    providerError: null,
    providerNextAttemptAt: null,
    providerOperationId: null,
    providerSyncAttempts: 0,
    providerSyncStatus: 'synced' as const,
    purpose: NEWSLETTER_PURPOSE,
    requestedAt: now.toISOString(),
    source: NEWSLETTER_SOURCE,
    status: 'pending' as const,
    suppressionReason: null,
    unsubscribeTokenCiphertext: null,
    unsubscribeTokenHash: null,
    unsubscribedAt: null,
    welcomeDeliveryAttempts: 0,
    welcomeDeliveryStatus: 'pending' as const,
    welcomeNextAttemptAt: null,
    welcomeOperationId: null,
    welcomeSentAt: null,
  }

  if (existing) {
    const result = await payload.update({
      collection: 'newsletter-subscriptions',
      context: newsletterAuditContext({
        eventKey: `${existing.id}:${generation}:signup_requested:${randomUUID()}`,
        eventType: 'signup_requested',
      }),
      data: commonData,
      limit: 1,
      overrideAccess: true,
      where: {
        and: [
          { id: { equals: existing.id } },
          { generation: { equals: existing.generation } },
          { status: { equals: existing.status } },
          { updatedAt: { equals: existing.updatedAt } },
        ],
      },
    })
    if (!result.docs[0]) return { status: 'accepted' }
  } else {
    try {
      await payload.create({
        collection: 'newsletter-subscriptions',
        context: newsletterAuditContext({
          eventKey: `new:${generation}:signup_requested:${randomUUID()}`,
          eventType: 'signup_requested',
        }),
        data: {
          ...commonData,
          email,
        },
        overrideAccess: true,
      })
    } catch (error) {
      if (await findSubscriptionByEmail(payload, email)) return { status: 'accepted' }
      throw error
    }
  }

  return { status: 'accepted' }
}

export const inspectNewsletterConfirmation = async (
  payload: Payload,
  token: string,
): Promise<NewsletterInspection> => {
  const subscription = await findSubscriptionByToken(payload, 'confirmationTokenHash', token)
  return {
    valid: Boolean(
      subscription?.status === 'pending' &&
        subscription.confirmationExpiresAt &&
        new Date(subscription.confirmationExpiresAt).getTime() > Date.now(),
    ),
  }
}

export const confirmNewsletterSubscription = async (
  payload: Payload,
  token: string,
): Promise<NewsletterMutationResult | null> => {
  const subscription = await findSubscriptionByToken(payload, 'confirmationTokenHash', token)
  if (
    !subscription ||
    subscription.status !== 'pending' ||
    !subscription.confirmationExpiresAt ||
    new Date(subscription.confirmationExpiresAt).getTime() <= Date.now()
  ) {
    return null
  }

  const unsubscribeToken = createOpaqueToken()
  const operationId = randomUUID()
  const confirmedAt = new Date().toISOString()
  const result = await payload.update({
    collection: 'newsletter-subscriptions',
    context: newsletterAuditContext({
      eventKey: `${subscription.id}:${subscription.generation}:consent_confirmed`,
      eventType: 'consent_confirmed',
    }),
    data: {
      confirmationExpiresAt: null,
      confirmationTokenHash: null,
      confirmedAt,
      providerError: null,
      providerNextAttemptAt: new Date().toISOString(),
      providerOperationId: operationId,
      providerSyncAttempts: 0,
      providerSyncStatus: 'pending',
      status: 'active',
      unsubscribeTokenCiphertext: encryptOpaqueToken(unsubscribeToken),
      unsubscribeTokenHash: hashOpaqueToken(unsubscribeToken),
      unsubscribedAt: null,
      welcomeDeliveryAttempts: 0,
      welcomeDeliveryStatus: 'pending',
      welcomeNextAttemptAt: new Date().toISOString(),
      welcomeSentAt: null,
    },
    limit: 1,
    overrideAccess: true,
    where: {
      and: [
        { id: { equals: subscription.id } },
        { confirmationTokenHash: { equals: hashOpaqueToken(token) } },
        { confirmationExpiresAt: { greater_than: confirmedAt } },
        { generation: { equals: subscription.generation } },
        { status: { equals: 'pending' } },
      ],
    },
  })
  const confirmed = result.docs[0]
  if (!confirmed) {
    const latest = await findSubscriptionByID(payload, subscription.id)
    return latest?.generation === subscription.generation && latest.status === 'active'
      ? { providerSynced: latest.providerSyncStatus === 'synced', status: 'confirmed' }
      : null
  }

  const providerSynced = await syncProvider(payload, confirmed)
  return { providerSynced, status: 'confirmed' }
}

export const inspectNewsletterUnsubscribe = async (
  payload: Payload,
  token: string,
): Promise<NewsletterInspection> => {
  const subscription = await findSubscriptionByToken(payload, 'unsubscribeTokenHash', token)
  return { valid: subscription?.status === 'active' || subscription?.status === 'unsubscribed' }
}

export const unsubscribeNewsletterSubscription = async (
  payload: Payload,
  token: string,
): Promise<NewsletterMutationResult | null> => {
  let subscription = await findSubscriptionByToken(payload, 'unsubscribeTokenHash', token)
  if (!subscription || !['active', 'unsubscribed'].includes(subscription.status)) return null

  if (subscription.status === 'active') {
    const operationId = randomUUID()
    const result = await payload.update({
      collection: 'newsletter-subscriptions',
      context: newsletterAuditContext({
        eventKey: `${subscription.id}:${subscription.generation}:unsubscribed`,
        eventType: 'unsubscribed',
      }),
      data: {
        providerError: null,
        providerNextAttemptAt: new Date().toISOString(),
        providerOperationId: operationId,
        providerSyncAttempts: 0,
        providerSyncStatus: 'pending',
        status: 'unsubscribed',
        suppressionReason: 'user_unsubscribe',
        unsubscribedAt: new Date().toISOString(),
      },
      limit: 1,
      overrideAccess: true,
      where: {
        and: [
          { id: { equals: subscription.id } },
          { generation: { equals: subscription.generation } },
          { status: { equals: 'active' } },
          { unsubscribeTokenHash: { equals: hashOpaqueToken(token) } },
        ],
      },
    })
    subscription = result.docs[0] ?? (await findSubscriptionByToken(payload, 'unsubscribeTokenHash', token))
    if (!subscription || subscription.status !== 'unsubscribed') return null
  }

  const providerSynced = await syncProvider(payload, subscription)
  return { providerSynced, status: 'unsubscribed' }
}

const retryConfirmation = async (
  payload: Payload,
  subscription: NewsletterSubscription,
): Promise<boolean | null> => {
  if (subscription.status !== 'pending') return null
  const token = createOpaqueToken()
  const tokenHash = hashOpaqueToken(token)
  const now = new Date()
  const result = await payload.update({
    collection: 'newsletter-subscriptions',
    data: {
      confirmationDeliveryStatus: 'sending',
      confirmationExpiresAt: new Date(now.getTime() + CONFIRMATION_TTL_MS).toISOString(),
      confirmationNextAttemptAt: leaseUntil(),
      confirmationSentAt: now.toISOString(),
      confirmationTokenHash: tokenHash,
    },
    limit: 1,
    overrideAccess: true,
    where: {
      and: [
        { id: { equals: subscription.id } },
        { status: { equals: 'pending' } },
        { updatedAt: { equals: subscription.updatedAt } },
      ],
    },
  })
  const claimed = result.docs[0]
  if (!claimed) return null
  return deliverConfirmation(payload, claimed, token)
}

const isDue = (value: null | string | undefined, now: number): boolean => !value || new Date(value).getTime() <= now

export const runNewsletterMaintenance = async (payload: Payload): Promise<NewsletterMaintenanceResult> => {
  const now = Date.now()
  const nowISO = new Date(now).toISOString()
  const result: NewsletterMaintenanceResult = {
    confirmationFailures: 0,
    confirmationRetries: 0,
    deletedRequestLimits: 0,
    expiredPending: 0,
    failedDeliveries: 0,
    providerFailures: 0,
    providerRetries: 0,
    remainingDue: 0,
    welcomeFailures: 0,
    welcomeRetries: 0,
  }

  const expiredLimits = await payload.delete({
    collection: 'newsletter-request-limits',
    overrideAccess: true,
    where: { expiresAt: { less_than_equal: nowISO } },
  })
  result.deletedRequestLimits = expiredLimits.docs.length

  const expiredPending = await payload.find({
    collection: 'newsletter-subscriptions',
    limit: 100,
    overrideAccess: true,
    sort: 'requestedAt',
    where: {
      and: [
        { requestedAt: { less_than_equal: new Date(now - PENDING_RETENTION_MS).toISOString() } },
        { status: { equals: 'pending' } },
      ],
    },
  })
  result.remainingDue += Math.max(0, expiredPending.totalDocs - expiredPending.docs.length)

  for (const candidate of expiredPending.docs) {
    const expired = await payload.update({
      collection: 'newsletter-subscriptions',
      context: newsletterAuditContext({
        eventKey: `${candidate.id}:${candidate.generation}:pending_expired`,
        eventType: 'pending_expired',
      }),
      data: {
        confirmationExpiresAt: null,
        confirmationNextAttemptAt: null,
        confirmationTokenHash: null,
        email: `expired-${randomUUID()}@example.invalid`,
        providerContactId: null,
        providerError: null,
        providerNextAttemptAt: null,
        providerOperationId: null,
        providerSyncAttempts: 0,
        providerSyncStatus: 'synced',
        status: 'expired',
        unsubscribeTokenCiphertext: null,
        unsubscribeTokenHash: null,
        welcomeNextAttemptAt: null,
        welcomeOperationId: null,
      },
      limit: 1,
      overrideAccess: true,
      where: {
        and: [
          { id: { equals: candidate.id } },
          { status: { equals: 'pending' } },
          { updatedAt: { equals: candidate.updatedAt } },
        ],
      },
    })
    result.expiredPending += expired.docs.length
  }

  if (isNewsletterEnabled()) {
    const confirmations = await payload.find({
      collection: 'newsletter-subscriptions',
      limit: 100,
      overrideAccess: true,
      sort: 'confirmationNextAttemptAt',
      where: {
        and: [
          { confirmationDeliveryStatus: { in: ['pending', 'sending', 'failed'] } },
          { confirmationNextAttemptAt: { less_than_equal: nowISO } },
          { status: { equals: 'pending' } },
        ],
      },
    })
    result.remainingDue += Math.max(0, confirmations.totalDocs - confirmations.docs.length)
    for (const candidate of confirmations.docs) {
      if (isDue(candidate.confirmationNextAttemptAt, now)) {
        const delivered = await retryConfirmation(payload, candidate)
        if (delivered === null) continue
        result.confirmationRetries += 1
        if (!delivered) result.confirmationFailures += 1
      }
    }
  }

  const providerCandidates = await payload.find({
    collection: 'newsletter-subscriptions',
    limit: 100,
    overrideAccess: true,
    sort: 'providerNextAttemptAt',
    where: {
      and: [
        { providerNextAttemptAt: { less_than_equal: nowISO } },
        { providerSyncStatus: { in: ['pending', 'syncing', 'failed'] } },
        { status: { in: isNewsletterEnabled() ? ['active', 'unsubscribed'] : ['unsubscribed'] } },
      ],
    },
  })
  result.remainingDue += Math.max(0, providerCandidates.totalDocs - providerCandidates.docs.length)
  for (const candidate of providerCandidates.docs) {
    if (isDue(candidate.providerNextAttemptAt, now)) {
      const synced = await syncProvider(payload, candidate)
      result.providerRetries += 1
      if (!synced) result.providerFailures += 1
    }
  }

  if (isNewsletterEnabled()) {
    const welcomes = await payload.find({
      collection: 'newsletter-subscriptions',
      limit: 100,
      overrideAccess: true,
      sort: 'welcomeNextAttemptAt',
      where: {
        and: [
          { providerSyncStatus: { equals: 'synced' } },
          { status: { equals: 'active' } },
          { welcomeDeliveryStatus: { in: ['pending', 'sending', 'failed'] } },
          { welcomeNextAttemptAt: { less_than_equal: nowISO } },
        ],
      },
    })
    result.remainingDue += Math.max(0, welcomes.totalDocs - welcomes.docs.length)
    for (const candidate of welcomes.docs) {
      if (isDue(candidate.welcomeNextAttemptAt, now)) {
        const delivered = await deliverWelcome(payload, candidate)
        result.welcomeRetries += 1
        if (!delivered) result.welcomeFailures += 1
      }
    }
  }

  const failedQueries = [
    payload.find({
      collection: 'newsletter-subscriptions',
      limit: 1,
      overrideAccess: true,
      where: {
        and: [
          { providerSyncStatus: { equals: 'failed' } },
          { status: { in: isNewsletterEnabled() ? ['active', 'unsubscribed'] : ['unsubscribed'] } },
        ],
      },
    }),
  ]
  if (isNewsletterEnabled()) {
    failedQueries.push(
      payload.find({
        collection: 'newsletter-subscriptions',
        limit: 1,
        overrideAccess: true,
        where: {
          and: [
            { confirmationDeliveryStatus: { equals: 'failed' } },
            { status: { equals: 'pending' } },
          ],
        },
      }),
      payload.find({
        collection: 'newsletter-subscriptions',
        limit: 1,
        overrideAccess: true,
        where: {
          and: [
            { status: { equals: 'active' } },
            { welcomeDeliveryStatus: { equals: 'failed' } },
          ],
        },
      }),
    )
  }
  result.failedDeliveries = (await Promise.all(failedQueries)).reduce(
    (total, query) => total + query.totalDocs,
    0,
  )

  return result
}

export const getNewsletterUnsubscribeToken = async (
  payload: Payload,
  subscriptionID: NewsletterSubscription['id'],
): Promise<string | null> => {
  const subscription = await findSubscriptionByID(payload, subscriptionID)
  if (!subscription?.unsubscribeTokenCiphertext || subscription.status !== 'active') return null
  return decryptOpaqueToken(subscription.unsubscribeTokenCiphertext)
}
