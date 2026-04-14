const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '')

const getOptionalEnv = (value: string | undefined): string | undefined => {
  if (!value) return undefined

  const trimmed = value.trim()

  return trimmed === '' ? undefined : trimmed
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
  return Boolean(
    getOptionalEnv(process.env.R2_ACCESS_KEY_ID) &&
      getOptionalEnv(process.env.R2_BUCKET) &&
      getR2StorageEndpoint() &&
      getR2PublicBaseUrl() &&
      getOptionalEnv(process.env.R2_SECRET_ACCESS_KEY),
  )
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
