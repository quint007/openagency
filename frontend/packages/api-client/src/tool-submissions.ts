export type ToolSubmissionInput = Record<string, unknown>;

export type ToolSubmissionResult = Record<string, unknown>;

export type ToolSubmissionViewModel = {
  createdAt: string;
  id: string;
  inputs: ToolSubmissionInput;
  result: ToolSubmissionResult;
  toolSlug: string;
};

export type PayloadToolSubmission = {
  id?: string | number | null;
  toolSlug?: string | null;
  email?: string | null;
  inputs?: ToolSubmissionInput | null;
  result?: ToolSubmissionResult | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type PayloadToolSubmissionCreateResponse = {
  doc: PayloadToolSubmission;
};

export type CreateToolSubmissionRequest = {
  toolSlug: string;
  email: string;
  inputs: ToolSubmissionInput;
  result: ToolSubmissionResult;
};

type ToolSubmissionRequestClient = {
  post<T>(endpoint: string, data?: unknown): Promise<T>;
};

function sanitizeUnknownToolSubmissionValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeUnknownToolSubmissionValue(entry));
  }

  if (value === null || typeof value !== 'object') {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== 'email')
      .map(([key, nestedValue]) => [key, sanitizeUnknownToolSubmissionValue(nestedValue)] as const),
  );
}

function sanitizeToolSubmissionInputs(inputs: ToolSubmissionInput): ToolSubmissionInput {
  return Object.fromEntries(
    Object.entries(inputs)
      .filter(([key]) => key !== 'email')
      .map(([key, value]) => [key, sanitizeUnknownToolSubmissionValue(value)] as const),
  );
}

function isPayloadToolSubmissionCreateResponse(
  response: PayloadToolSubmission | PayloadToolSubmissionCreateResponse,
): response is PayloadToolSubmissionCreateResponse {
  return 'doc' in response;
}

function cleanText(value?: string | null): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length > 0 ? normalized : null;
}

export function mapToolSubmissionToViewModel(
  submission: PayloadToolSubmission,
): ToolSubmissionViewModel | null {
  const id = submission.id;
  const toolSlug = cleanText(submission.toolSlug);

  if (!id || !toolSlug) {
    return null;
  }

  return {
    id: String(id),
    toolSlug,
    inputs: sanitizeToolSubmissionInputs(submission.inputs ?? {}),
    result: submission.result ?? {},
    createdAt: submission.createdAt ?? new Date().toISOString(),
  };
}

export async function createToolSubmission(
  client: ToolSubmissionRequestClient,
  request: CreateToolSubmissionRequest,
): Promise<ToolSubmissionViewModel> {
  const response = await client.post<PayloadToolSubmission | PayloadToolSubmissionCreateResponse>('/tool-submissions', {
    toolSlug: request.toolSlug,
    email: request.email,
    inputs: request.inputs,
    result: request.result,
  });
  const submission = isPayloadToolSubmissionCreateResponse(response) ? response.doc : response;
  const viewModel = mapToolSubmissionToViewModel(submission);

  if (!viewModel) {
    throw new TypeError('Failed to create tool submission: invalid response from API');
  }

  return viewModel;
}
