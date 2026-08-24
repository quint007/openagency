import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { usersOnly } from '../access/usersOnly'

type ToolSubmissionData = {
  readonly email?: string
  readonly id: number | string
  readonly inputs?: unknown
  readonly result?: unknown
  readonly toolSlug?: string
}

const sanitizeInputValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sanitizeInputValue)
  }

  if (value === null || typeof value !== 'object') {
    return value
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== 'email')
      .map(([key, nestedValue]) => [key, sanitizeInputValue(nestedValue)] as const),
  )
}

export const sanitizeToolSubmissionInputs: CollectionBeforeValidateHook<ToolSubmissionData> = ({ data }) => {
  if (!data || data.inputs === undefined) {
    return data
  }

  return {
    ...data,
    inputs: sanitizeInputValue(data.inputs),
  }
}

export const ToolSubmissions: CollectionConfig = {
  slug: 'tool-submissions',
  access: {
    create: anyone,
    delete: usersOnly,
    read: ({ req: { user }, id }) => {
      // Admins can list and read every submission.
      if (user?.collection === 'users') {
        return true
      }

      // Public visitors can only read a specific submission by ID. This powers
      // shareable result links without exposing the full collection.
      return Boolean(id)
    },
    update: usersOnly,
  },
  admin: {
    defaultColumns: ['toolSlug', 'email', 'createdAt'],
    useAsTitle: 'toolSlug',
  },
  hooks: {
    beforeValidate: [sanitizeToolSubmissionInputs],
  },
  fields: [
    {
      name: 'toolSlug',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      access: {
        read: ({ req: { user } }) => user?.collection === 'users',
      },
    },
    {
      name: 'inputs',
      type: 'json',
      required: true,
    },
    {
      name: 'result',
      type: 'json',
      required: true,
    },
  ],
  timestamps: true,
}
