import type { CollectionAfterReadHook, CollectionBeforeValidateHook, CollectionConfig } from 'payload'
import { ValidationError } from 'payload'

import { anyone } from '../access/anyone'
import { usersOnly } from '../access/usersOnly'

export const localModelCalculatorToolSlug = 'local-model-calculator'

const operatingSystems = ['macos', 'windows', 'linux'] as const
const useCases = ['coding', 'writing', 'multimodal', 'privacy', 'general'] as const

type OperatingSystem = (typeof operatingSystems)[number]
type UseCase = (typeof useCases)[number]

export type CalculatorMachineProfile = {
  readonly os: OperatingSystem
  readonly ramGb: number
  readonly useCase: UseCase
  readonly vramGb: number
}

type ToolSubmissionData = {
  readonly email?: string
  readonly id: number | string
  readonly inputs?: unknown
  readonly result?: unknown
  readonly toolSlug?: unknown
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const isOperatingSystem = (value: unknown): value is OperatingSystem =>
  typeof value === 'string' && operatingSystems.some((operatingSystem) => operatingSystem === value)

const isUseCase = (value: unknown): value is UseCase =>
  typeof value === 'string' && useCases.some((useCase) => useCase === value)

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const invalidSubmission = (path: 'inputs' | 'toolSlug', message: string): never => {
  throw new ValidationError({
    collection: 'tool-submissions',
    errors: [{ message, path }],
  })
}

export const parseCalculatorMachineProfile = (value: unknown): CalculatorMachineProfile | null => {
  if (!isRecord(value)) return null

  const { os, ramGb, useCase, vramGb } = value

  if (!isOperatingSystem(os) || !isFiniteNumber(ramGb) || !isUseCase(useCase) || !isFiniteNumber(vramGb)) {
    return null
  }

  return { os, ramGb, useCase, vramGb }
}

const isAdmin = (user: unknown): boolean =>
  isRecord(user) &&
  user.collection === 'users' &&
  Array.isArray(user.roles) &&
  user.roles.includes('admin')

export const canonicalizeToolSubmission: CollectionBeforeValidateHook<ToolSubmissionData> = ({
  data,
  originalDoc,
}) => {
  if (!data) return data

  const toolSlug = data.toolSlug === undefined ? originalDoc?.toolSlug : data.toolSlug

  if (toolSlug !== localModelCalculatorToolSlug) {
    return invalidSubmission('toolSlug', 'Only the local model calculator supports public submissions.')
  }

  const rawInputs = data.inputs === undefined ? originalDoc?.inputs : data.inputs
  const inputs = parseCalculatorMachineProfile(rawInputs)

  if (!inputs) {
    return invalidSubmission('inputs', 'A local model calculator submission requires a valid machine profile.')
  }

  return {
    ...data,
    inputs,
    result: {},
    toolSlug: localModelCalculatorToolSlug,
  }
}

export const redactPublicToolSubmission: CollectionAfterReadHook<ToolSubmissionData> = ({ doc, req }) => {
  if (isAdmin(req.user)) return doc

  const { email: _email, ...publicDocument } = doc
  const inputs = parseCalculatorMachineProfile(doc.inputs)

  return {
    ...publicDocument,
    inputs: inputs ?? {},
    result: {},
  }
}

export const ToolSubmissions: CollectionConfig = {
  slug: 'tool-submissions',
  access: {
    create: anyone,
    delete: usersOnly,
    read: ({ req: { user }, id }) => {
      if (isAdmin(user)) return true

      return id
        ? {
            toolSlug: {
              equals: localModelCalculatorToolSlug,
            },
          }
        : false
    },
    update: usersOnly,
  },
  admin: {
    defaultColumns: ['toolSlug', 'email', 'createdAt'],
    useAsTitle: 'toolSlug',
  },
  hooks: {
    afterRead: [redactPublicToolSubmission],
    beforeValidate: [canonicalizeToolSubmission],
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
        read: ({ req: { user } }) => isAdmin(user),
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
