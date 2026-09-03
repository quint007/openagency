import type { CollectionAfterChangeHook, RequestContext } from 'payload'

import type { NewsletterConsentEvent, NewsletterSubscription } from '@/payload-types'

export type NewsletterAuditEvent = {
  eventKey: string
  eventType: NewsletterConsentEvent['eventType']
  providerMessageId?: string
}

const contextKey = 'newsletterAuditEvent'

export const newsletterAuditContext = (event: NewsletterAuditEvent): RequestContext => ({
  [contextKey]: event,
})

export const appendNewsletterAuditEvent: CollectionAfterChangeHook<NewsletterSubscription> = async ({
  context,
  doc,
  req,
}) => {
  const event = context[contextKey] as NewsletterAuditEvent | undefined
  if (!event) return doc

  await req.payload.create({
    collection: 'newsletter-consent-events',
    data: {
      consentVersion: doc.consentVersion,
      eventKey: event.eventKey,
      eventType: event.eventType,
      generation: doc.generation,
      occurredAt: new Date().toISOString(),
      privacyVersion: doc.privacyVersion,
      providerMessageId: event.providerMessageId,
      purpose: doc.purpose,
      source: doc.source,
      subscription: doc.id,
    },
    overrideAccess: true,
    req,
  })

  return doc
}
