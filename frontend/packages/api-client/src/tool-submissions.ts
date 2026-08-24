export const localModelCalculatorToolSlug = 'local-model-calculator'

const operatingSystems = ['macos', 'windows', 'linux'] as const
const useCases = ['coding', 'writing', 'multimodal', 'privacy', 'general'] as const

type OperatingSystem = (typeof operatingSystems)[number]
type UseCase = (typeof useCases)[number]

export type ToolSubmissionInput = {
  readonly os: OperatingSystem
  readonly ramGb: number
  readonly useCase: UseCase
  readonly vramGb: number
}

export type ToolSubmissionResult = Record<string, never>

export type ToolSubmissionViewModel = {
  readonly createdAt: string
  readonly id: string
  readonly inputs: ToolSubmissionInput
  readonly result: ToolSubmissionResult
  readonly toolSlug: typeof localModelCalculatorToolSlug
}

export type PayloadToolSubmission = {
  readonly createdAt?: string | null
  readonly email?: string | null
  readonly id?: string | number | null
  readonly inputs?: unknown
  readonly result?: unknown
  readonly toolSlug?: string | null
  readonly updatedAt?: string | null
}

type PayloadToolSubmissionCreateResponse = {
  readonly doc: PayloadToolSubmission
}

export type CreateToolSubmissionRequest = {
  readonly email: string
  readonly inputs: ToolSubmissionInput
  readonly toolSlug: typeof localModelCalculatorToolSlug
}

type ToolSubmissionRequestClient = {
  post<T>(endpoint: string, data?: unknown): Promise<T>
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const isOperatingSystem = (value: unknown): value is OperatingSystem =>
  typeof value === 'string' && operatingSystems.some((operatingSystem) => operatingSystem === value)

const isUseCase = (value: unknown): value is UseCase =>
  typeof value === 'string' && useCases.some((useCase) => useCase === value)

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const parseToolSubmissionInput = (value: unknown): ToolSubmissionInput | null => {
  if (!isRecord(value)) return null

  const { os, ramGb, useCase, vramGb } = value

  if (!isOperatingSystem(os) || !isFiniteNumber(ramGb) || !isUseCase(useCase) || !isFiniteNumber(vramGb)) {
    return null
  }

  return { os, ramGb, useCase, vramGb }
}

const isPayloadToolSubmissionCreateResponse = (
  response: PayloadToolSubmission | PayloadToolSubmissionCreateResponse,
): response is PayloadToolSubmissionCreateResponse => 'doc' in response

const cleanText = (value?: string | null): string | null => {
  if (typeof value !== 'string') return null

  const normalized = value.replace(/\s+/g, ' ').trim()
  return normalized.length > 0 ? normalized : null
}

export const mapToolSubmissionToViewModel = (
  submission: PayloadToolSubmission,
): ToolSubmissionViewModel | null => {
  const id = submission.id
  const inputs = parseToolSubmissionInput(submission.inputs)

  if (!id || submission.toolSlug !== localModelCalculatorToolSlug || !inputs) return null

  return {
    createdAt: submission.createdAt ?? new Date().toISOString(),
    id: String(id),
    inputs,
    result: {},
    toolSlug: localModelCalculatorToolSlug,
  }
}

export const createToolSubmission = async (
  client: ToolSubmissionRequestClient,
  request: CreateToolSubmissionRequest,
): Promise<ToolSubmissionViewModel> => {
  const response = await client.post<PayloadToolSubmission | PayloadToolSubmissionCreateResponse>(
    '/tool-submissions',
    {
      email: request.email,
      inputs: request.inputs,
      toolSlug: request.toolSlug,
    },
  )
  const submission = isPayloadToolSubmissionCreateResponse(response) ? response.doc : response
  const viewModel = mapToolSubmissionToViewModel(submission)

  if (!viewModel) {
    throw new TypeError('Failed to create tool submission: invalid response from API')
  }

  return viewModel
}
