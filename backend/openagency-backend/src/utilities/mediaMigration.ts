import { promises as fs } from 'node:fs'
import path from 'node:path'

import { rewriteMediaUrl } from './mediaStorage'

export type MediaMigrationRecord = {
  filename?: null | string
  filesize?: null | number
  id: number | string
  mimeType?: null | string
  prefix?: null | string
  sizes?:
    | null
    | Record<
        string,
        | {
            filename?: null | string
            url?: null | string
          }
        | null
      >
  url?: null | string
}

export type MediaMigrationFile = {
  data: Buffer
  mimetype: string
  name: string
  size: number
}

export type MediaMigrationVerification = {
  error?: string
  ok: boolean
  status: number | null
  url: string
}

export type MediaMigrationSummary = {
  failedCount: number
  failures: Array<{
    id: number | string
    reason: string
    url: string | null
  }>
  legacyDirectory: string
  migratedCount: number
  mode: 'migrated' | 'noop'
  skippedCount: number
  totalCount: number
  verifiedAsset: null | {
    id: number | string
    status: number
    url: string
  }
}

type MediaMigrationAdapter = {
  listMedia: () => Promise<MediaMigrationRecord[]>
  uploadMediaFile: (args: {
    doc: MediaMigrationRecord
    file: MediaMigrationFile
  }) => Promise<MediaMigrationRecord>
}

type MediaMigrationDependencies = {
  adapter: MediaMigrationAdapter
  legacyDirectory: string
  logger?: {
    error?: (message: string) => void
    info?: (message: string) => void
  }
  readFile?: (filePath: string) => Promise<Buffer>
  stat?: (filePath: string) => Promise<{ isFile: () => boolean }>
  verifyUrl: (url: string) => Promise<MediaMigrationVerification>
}

const DEFAULT_MIME_TYPE = 'application/octet-stream'

const sortMediaRecords = (left: MediaMigrationRecord, right: MediaMigrationRecord): number => {
  const leftName = `${left.filename ?? ''}`
  const rightName = `${right.filename ?? ''}`

  if (leftName !== rightName) {
    return leftName.localeCompare(rightName)
  }

  return `${left.id}`.localeCompare(`${right.id}`)
}

const trimSlashes = (value: string): string => value.replace(/^\/+|\/+$/g, '')

const buildAssetPath = (doc: MediaMigrationRecord, filename: string): string => {
  const prefix = trimSlashes(doc.prefix ?? '')

  return prefix ? path.posix.join(prefix, filename) : filename
}

export const buildPublicAssetUrl = (
  publicBaseUrl: string,
  doc: MediaMigrationRecord,
  filename: string,
): string => {
  const assetPath = buildAssetPath(doc, filename)

  return `${publicBaseUrl.replace(/\/+$/, '')}/${assetPath}`
}

const inferMimeTypeFromFilename = (filename: string): string => {
  const extension = path.extname(filename).toLowerCase()

  switch (extension) {
    case '.avif':
      return 'image/avif'
    case '.gif':
      return 'image/gif'
    case '.jpeg':
    case '.jpg':
      return 'image/jpeg'
    case '.json':
      return 'application/json'
    case '.pdf':
      return 'application/pdf'
    case '.png':
      return 'image/png'
    case '.svg':
      return 'image/svg+xml'
    case '.txt':
      return 'text/plain'
    case '.webp':
      return 'image/webp'
    default:
      return DEFAULT_MIME_TYPE
  }
}

export const normalizeMediaRecordUrl = (doc: MediaMigrationRecord): null | string => {
  const rewrittenUrl = rewriteMediaUrl(doc.url)

  return rewrittenUrl ?? null
}

const isAlreadyCutOver = (doc: MediaMigrationRecord, expectedUrl: string): boolean => {
  return normalizeMediaRecordUrl(doc) === expectedUrl
}

const getLegacyMediaFilePath = (legacyDirectory: string, doc: MediaMigrationRecord): null | string => {
  if (!doc.filename) {
    return null
  }

  return path.join(legacyDirectory, buildAssetPath(doc, doc.filename))
}

const legacyFileExists = async (
  filePath: null | string,
  stat: NonNullable<MediaMigrationDependencies['stat']>,
): Promise<boolean> => {
  if (!filePath) {
    return false
  }

  try {
    return (await stat(filePath)).isFile()
  } catch {
    return false
  }
}

const createMigrationFile = (doc: MediaMigrationRecord, data: Buffer): MediaMigrationFile => {
  const filename = doc.filename

  if (!filename) {
    throw new Error(`Media document ${String(doc.id)} is missing a filename.`)
  }

  return {
    data,
    mimetype: doc.mimeType ?? inferMimeTypeFromFilename(filename),
    name: filename,
    size: data.byteLength,
  }
}

const verifyRepresentativeAsset = async (
  doc: MediaMigrationRecord,
  publicBaseUrl: string,
  verifyUrl: MediaMigrationDependencies['verifyUrl'],
): Promise<MediaMigrationVerification | null> => {
  if (!doc.filename) {
    return null
  }

  return verifyUrl(buildPublicAssetUrl(publicBaseUrl, doc, doc.filename))
}

export const runMediaMigration = async ({
  adapter,
  legacyDirectory,
  logger,
  publicBaseUrl,
  readFile = fs.readFile,
  stat = fs.stat,
  verifyUrl,
}: MediaMigrationDependencies & { publicBaseUrl: string }): Promise<MediaMigrationSummary> => {
  const docs = (await adapter.listMedia()).sort(sortMediaRecords)
  const failures: MediaMigrationSummary['failures'] = []
  let migratedCount = 0
  let skippedCount = 0
  let verifiedAsset: MediaMigrationSummary['verifiedAsset'] = null

  logger?.info?.(`Checking ${docs.length} media record(s) in ${legacyDirectory}.`)

  for (const doc of docs) {
    if (!doc.filename) {
      skippedCount += 1
      continue
    }

    const expectedUrl = buildPublicAssetUrl(publicBaseUrl, doc, doc.filename)
    const currentVerification = await verifyRepresentativeAsset(doc, publicBaseUrl, verifyUrl)

    if (isAlreadyCutOver(doc, expectedUrl) && currentVerification?.ok) {
      skippedCount += 1

      if (!verifiedAsset) {
        verifiedAsset = {
          id: doc.id,
          status: currentVerification.status ?? 200,
          url: currentVerification.url,
        }
      }

      continue
    }

    const legacyFilePath = getLegacyMediaFilePath(legacyDirectory, doc)
    const sourceFileExists = await legacyFileExists(legacyFilePath, stat)

    if (!sourceFileExists || !legacyFilePath) {
      failures.push({
        id: doc.id,
        reason: 'Legacy source file is missing for a media record that is not yet cut over.',
        url: expectedUrl,
      })
      continue
    }

    const migratedDoc = await adapter.uploadMediaFile({
      doc,
      file: createMigrationFile(doc, await readFile(legacyFilePath)),
    })
    const migratedVerification = await verifyRepresentativeAsset(
      migratedDoc,
      publicBaseUrl,
      verifyUrl,
    )

    if (!migratedVerification?.ok) {
      failures.push({
        id: doc.id,
        reason: migratedVerification?.error ?? 'Representative asset URL could not be verified.',
        url: migratedVerification?.url ?? expectedUrl,
      })
      continue
    }

    migratedCount += 1

    if (!verifiedAsset) {
      verifiedAsset = {
        id: migratedDoc.id,
        status: migratedVerification.status ?? 200,
        url: migratedVerification.url,
      }
    }
  }

  if (failures.length > 0) {
    logger?.error?.(`Media migration failed for ${failures.length} record(s).`)
  }

  return {
    failedCount: failures.length,
    failures,
    legacyDirectory,
    migratedCount,
    mode: migratedCount > 0 ? 'migrated' : 'noop',
    skippedCount,
    totalCount: docs.length,
    verifiedAsset,
  }
}

export const verifyReadableAssetUrl = async (url: string): Promise<MediaMigrationVerification> => {
  try {
    const response = await fetch(url, {
      headers: {
        range: 'bytes=0-0',
      },
      method: 'GET',
    })

    await response.body?.cancel()

    return {
      ok: response.ok,
      status: response.status,
      url,
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown fetch error.',
      ok: false,
      status: null,
      url,
    }
  }
}
