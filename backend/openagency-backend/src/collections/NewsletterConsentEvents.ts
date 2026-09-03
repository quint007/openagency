import type { Access, CollectionConfig } from 'payload'

const isAdmin: Access = ({ req: { user } }) =>
  Boolean(user?.collection === 'users' && 'roles' in user && user.roles?.includes('admin'))

export const NewsletterConsentEvents: CollectionConfig = {
  slug: 'newsletter-consent-events',
  access: {
    create: () => false,
    delete: () => false,
    read: isAdmin,
    update: () => false,
  },
  admin: {
    defaultColumns: ['eventType', 'subscription', 'generation', 'occurredAt'],
    group: 'Compliance',
    useAsTitle: 'eventKey',
  },
  fields: [
    {
      name: 'subscription',
      type: 'relationship',
      relationTo: 'newsletter-subscriptions',
      required: true,
    },
    {
      name: 'generation',
      type: 'number',
      min: 1,
      required: true,
    },
    {
      name: 'eventType',
      type: 'select',
      options: [
        'signup_requested',
        'confirmation_sent',
        'confirmation_delivery_failed',
        'pending_expired',
        'consent_confirmed',
        'unsubscribed',
        'provider_synced',
        'provider_sync_failed',
        'welcome_sent',
        'welcome_delivery_failed',
      ],
      required: true,
    },
    {
      name: 'eventKey',
      type: 'text',
      index: true,
      required: true,
      unique: true,
    },
    {
      name: 'occurredAt',
      type: 'date',
      required: true,
    },
    {
      name: 'purpose',
      type: 'text',
      required: true,
    },
    {
      name: 'consentVersion',
      type: 'text',
      required: true,
    },
    {
      name: 'privacyVersion',
      type: 'text',
      required: true,
    },
    {
      name: 'source',
      type: 'text',
      required: true,
    },
    {
      name: 'providerMessageId',
      type: 'text',
    },
  ],
  timestamps: true,
}
