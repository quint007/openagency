import type { Access, CollectionConfig } from 'payload'

import { appendNewsletterAuditEvent } from '@/newsletter/audit'

const isAdmin: Access = ({ req: { user } }) =>
  Boolean(user?.collection === 'users' && 'roles' in user && user.roles?.includes('admin'))

export const NewsletterSubscriptions: CollectionConfig = {
  slug: 'newsletter-subscriptions',
  access: {
    create: () => false,
    delete: () => false,
    read: isAdmin,
    update: () => false,
  },
  admin: {
    defaultColumns: ['email', 'status', 'generation', 'providerSyncStatus', 'updatedAt'],
    group: 'Compliance',
    useAsTitle: 'email',
  },
  hooks: {
    afterChange: [appendNewsletterAuditEvent],
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      index: true,
      required: true,
      unique: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      index: true,
      options: ['pending', 'active', 'unsubscribed', 'suppressed', 'expired'],
      required: true,
    },
    {
      name: 'generation',
      type: 'number',
      defaultValue: 1,
      min: 1,
      required: true,
    },
    {
      name: 'purpose',
      type: 'text',
      defaultValue: 'newsletter_marketing',
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
      name: 'requestedAt',
      type: 'date',
      required: true,
    },
    {
      name: 'confirmationTokenHash',
      type: 'text',
      admin: { hidden: true },
      index: true,
    },
    {
      name: 'confirmationExpiresAt',
      type: 'date',
    },
    {
      name: 'confirmationSentAt',
      type: 'date',
    },
    {
      name: 'confirmationDeliveryStatus',
      type: 'select',
      defaultValue: 'pending',
      options: ['pending', 'sending', 'sent', 'failed'],
      required: true,
    },
    {
      name: 'confirmationDeliveryAttempts',
      type: 'number',
      defaultValue: 0,
      min: 0,
      required: true,
    },
    {
      name: 'confirmationNextAttemptAt',
      type: 'date',
      index: true,
    },
    {
      name: 'confirmedAt',
      type: 'date',
    },
    {
      name: 'unsubscribedAt',
      type: 'date',
    },
    {
      name: 'unsubscribeTokenHash',
      type: 'text',
      admin: { hidden: true },
      index: true,
    },
    {
      name: 'unsubscribeTokenCiphertext',
      type: 'text',
      admin: { hidden: true },
    },
    {
      name: 'suppressionReason',
      type: 'select',
      options: ['user_unsubscribe', 'complaint', 'hard_bounce', 'administrative'],
    },
    {
      name: 'providerSyncStatus',
      type: 'select',
      defaultValue: 'pending',
      options: ['pending', 'syncing', 'synced', 'failed'],
      required: true,
    },
    {
      name: 'providerOperationId',
      type: 'text',
      admin: { hidden: true },
    },
    {
      name: 'providerContactId',
      type: 'text',
    },
    {
      name: 'providerSyncAttempts',
      type: 'number',
      defaultValue: 0,
      min: 0,
      required: true,
    },
    {
      name: 'providerNextAttemptAt',
      type: 'date',
      index: true,
    },
    {
      name: 'providerError',
      type: 'text',
    },
    {
      name: 'welcomeSentAt',
      type: 'date',
    },
    {
      name: 'welcomeDeliveryStatus',
      type: 'select',
      defaultValue: 'pending',
      options: ['pending', 'sending', 'sent', 'failed'],
      required: true,
    },
    {
      name: 'welcomeDeliveryAttempts',
      type: 'number',
      defaultValue: 0,
      min: 0,
      required: true,
    },
    {
      name: 'welcomeNextAttemptAt',
      type: 'date',
      index: true,
    },
    {
      name: 'welcomeOperationId',
      type: 'text',
      admin: { hidden: true },
    },
  ],
  timestamps: true,
}
