const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '')

const r2EndpointHostPattern = /^[a-z0-9]+(?:\.[a-z0-9-]+)?\.r2\.cloudflarestorage\.com$/

const getOptionalEnv = (value: string | undefined): string | undefined => {
  if (!value) return undefined

  const trimmed = value.trim()

  return trimmed === '' ? undefined : trimmed
}

const parseHttpUrl = (value: string, label: string): URL | string => {
  try {
    const url = new URL(value)

    if (url.protocol !== 'https:') {
      return `${label} must use https://.`
    }

    if (url.username || url.password || url.search || url.hash) {
      return `${label} must not include credentials, query parameters, or a hash.`
    }

    return url
  } catch {
    return `${label} must be a valid https URL.`
  }
}

const getR2StorageConfigurationError = (): string | undefined => {
  const bucket = getOptionalEnv(process.env.R2_BUCKET)
  const endpoint = getOptionalEnv(process.env.R2_ENDPOINT)
  const publicBaseUrl = getOptionalEnv(process.env.R2_PUBLIC_BASE_URL)

  if (!getOptionalEnv(process.env.R2_ACCESS_KEY_ID)) return 'R2_ACCESS_KEY_ID is missing.'
  if (!bucket) return 'R2_BUCKET is missing.'
  if (bucket.includes('/')) return 'R2_BUCKET must be a bucket name, not a path.'
  if (!endpoint) return 'R2_ENDPOINT is missing.'
  if (!publicBaseUrl) return 'R2_PUBLIC_BASE_URL is missing.'
  if (!getOptionalEnv(process.env.R2_SECRET_ACCESS_KEY)) return 'R2_SECRET_ACCESS_KEY is missing.'

  const endpointUrl = parseHttpUrl(endpoint, 'R2_ENDPOINT')

  if (typeof endpointUrl === 'string') return endpointUrl
  if (!r2EndpointHostPattern.test(endpointUrl.hostname)) {
    return 'R2_ENDPOINT must be a Cloudflare R2 S3 endpoint such as https://<account-id>.r2.cloudflarestorage.com.'
  }
  if (endpointUrl.pathname !== '/') {
    return 'R2_ENDPOINT must not include the bucket name or any path; set the bucket in R2_BUCKET.'
  }

  const publicBaseUrlValue = parseHttpUrl(publicBaseUrl, 'R2_PUBLIC_BASE_URL')

  if (typeof publicBaseUrlValue === 'string') return publicBaseUrlValue

  return undefined
}

export const getR2StorageEndpoint = (): string | undefined => {
  const endpoint = getOptionalEnv(process.env.R2_ENDPOINT)

  return endpoint ? trimTrailingSlash(endpoint) : undefined
}

export const getR2PublicBaseUrl = (): string | undefined => {
  const publicBaseUrl = getOptionalEnv(process.env.R2_PUBLIC_BASE_URL)

  return publicBaseUrl ? trimTrailingSlash(publicBaseUrl) : undefined
}

export const isR2StorageConfigured = (): boolean => {
  return getR2StorageConfigurationError() === undefined
}

export const getR2StorageDiagnostics = (): { bucket?: string; endpointHost?: string; error?: string } => {
  const endpoint = getR2StorageEndpoint()
  const error = getR2StorageConfigurationError()
  const endpointUrl = endpoint && !error ? new URL(endpoint) : undefined

  return {
    bucket: getOptionalEnv(process.env.R2_BUCKET),
    endpointHost: endpointUrl?.hostname,
    error,
  }
}

export const getMediaRemoteHostUrls = (): string[] => {
  return [process.env.NEXT_PUBLIC_SERVER_URL, getR2PublicBaseUrl()].filter(
    (value): value is string => Boolean(value),
  )
}

export const rewriteMediaUrl = (url: string | null | undefined): string | null | undefined => {
  if (!url) return url

  const endpoint = getR2StorageEndpoint()
  const publicBaseUrl = getR2PublicBaseUrl()
  const bucket = getOptionalEnv(process.env.R2_BUCKET)

  if (!endpoint || !publicBaseUrl || !bucket) {
    return url
  }

  const apiPrefix = `${endpoint}/${bucket}/`

  if (!url.startsWith(apiPrefix)) {
    return url
  }

  return `${publicBaseUrl}/${url.slice(apiPrefix.length)}`
}

type MediaSize = {
  url?: string | null
} | null

type MediaDocumentLike = {
  sizes?: Record<string, MediaSize> | null
  url?: string | null
}

export const rewriteMediaDocumentUrls = <T extends MediaDocumentLike | null | undefined>(doc: T): T => {
  if (!doc) return doc

  doc.url = rewriteMediaUrl(doc.url)

  if (doc.sizes) {
    for (const size of Object.values(doc.sizes)) {
      if (size) {
        size.url = rewriteMediaUrl(size.url)
      }
    }
  }

  return doc
}
