import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { promises as fs } from 'node:fs'
import path from 'node:path'

import config from '@payload-config'
import { getPayload } from 'payload'

import {
  runMediaMigration,
  type MediaMigrationRecord,
  verifyReadableAssetUrl,
} from '@/utilities/mediaMigration'
import { getR2PublicBaseUrl } from '@/utilities/mediaStorage'

type ParsedArgs = {
  fixtureRoot?: string
  legacyDirectory?: string
}

type FixtureState = {
  media: MediaMigrationRecord[]
  publicBaseUrl: string
}

const parseArgs = (argv: string[]): ParsedArgs => {
  const parsed: ParsedArgs = {}

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index]
    const nextValue = argv[index + 1]

    if (current === '--fixture' && nextValue) {
      parsed.fixtureRoot = path.resolve(nextValue)
      index += 1
      continue
    }

    if (current === '--legacy-dir' && nextValue) {
      parsed.legacyDirectory = path.resolve(nextValue)
      index += 1
    }
  }

  return parsed
}

const createFixtureServer = async (remoteDirectory: string, publicBaseUrl: string) => {
  const fixtureUrl = new URL(publicBaseUrl)
  const server = createServer(async (request, response) => {
    const pathname = new URL(request.url ?? '/', 'http://127.0.0.1').pathname
    const resolvedFilePath = path.resolve(remoteDirectory, `.${pathname}`)

    if (!resolvedFilePath.startsWith(remoteDirectory)) {
      response.statusCode = 403
      response.end('Forbidden')
      return
    }

    try {
      const content = await fs.readFile(resolvedFilePath)

      response.statusCode = 200
      response.end(content)
    } catch {
      response.statusCode = 404
      response.end('Not found')
    }
  })

  await new Promise<void>((resolve) => {
    server.listen(Number(fixtureUrl.port), fixtureUrl.hostname, () => resolve())
  })

  const address = server.address()

  if (!address || typeof address === 'string') {
    throw new Error('Fixture HTTP server failed to bind.')
  }

  const boundAddress: AddressInfo = address

  return {
    close: async () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error)
            return
          }

          resolve()
        })
      }),
    publicBaseUrl: `http://127.0.0.1:${boundAddress.port}`,
  }
}

const runFixtureMigration = async (fixtureRoot: string) => {
  const stateFile = path.join(fixtureRoot, 'state.json')
  const legacyDirectory = path.join(fixtureRoot, 'legacy')
  const remoteDirectory = path.join(fixtureRoot, 'remote')

  await fs.mkdir(remoteDirectory, { recursive: true })

  const state = JSON.parse(await fs.readFile(stateFile, 'utf8')) as FixtureState
  const server = await createFixtureServer(remoteDirectory, state.publicBaseUrl)

  try {
    const summary = await runMediaMigration({
      adapter: {
        listMedia: async () => state.media,
        uploadMediaFile: async ({ doc, file }) => {
          const relativePath = doc.prefix ? path.join(doc.prefix, file.name) : file.name
          const outputPath = path.join(remoteDirectory, relativePath)

          await fs.mkdir(path.dirname(outputPath), { recursive: true })
          await fs.writeFile(outputPath, file.data)

          const updatedDoc = {
            ...doc,
            filesize: file.size,
            mimeType: file.mimetype,
            url: `${server.publicBaseUrl}/${relativePath.replace(/^\/+/, '')}`,
          }

          const docIndex = state.media.findIndex((candidate) => `${candidate.id}` === `${doc.id}`)

          state.media.splice(docIndex, 1, updatedDoc)

          return updatedDoc
        },
      },
      legacyDirectory,
      logger: console,
      publicBaseUrl: server.publicBaseUrl,
      verifyUrl: verifyReadableAssetUrl,
    })

    await fs.writeFile(stateFile, `${JSON.stringify(state, null, 2)}\n`)

    return summary
  } finally {
    await server.close()
  }
}

const runPayloadMigration = async (legacyDirectory: string) => {
  const publicBaseUrl = getR2PublicBaseUrl()

  if (!publicBaseUrl) {
    throw new Error('R2_PUBLIC_BASE_URL must be set before running the media migration command.')
  }

  const payload = await getPayload({ config })

  return runMediaMigration({
    adapter: {
      listMedia: async () => {
        const records: MediaMigrationRecord[] = []
        let page = 1
        let totalPages = 1

        while (page <= totalPages) {
          const result = await payload.find({
            collection: 'media',
            depth: 0,
            limit: 100,
            page,
            sort: 'filename',
          })

          records.push(...(result.docs as MediaMigrationRecord[]))
          totalPages = result.totalPages
          page += 1
        }

        return records
      },
      uploadMediaFile: async ({ doc, file }) => {
        const updatedDoc = await payload.update({
          collection: 'media',
          data: {},
          depth: 0,
          file,
          id: doc.id,
        })

        return updatedDoc as MediaMigrationRecord
      },
    },
    legacyDirectory,
    logger: payload.logger,
    publicBaseUrl,
    verifyUrl: verifyReadableAssetUrl,
  })
}

const main = async () => {
  const args = parseArgs(process.argv.slice(2))
  const legacyDirectory = args.legacyDirectory ?? path.resolve(process.cwd(), 'public/media')
  const summary = args.fixtureRoot
    ? await runFixtureMigration(args.fixtureRoot)
    : await runPayloadMigration(legacyDirectory)

  console.log(JSON.stringify(summary, null, 2))

  if (summary.failedCount > 0) {
    process.exitCode = 1
  }
}

await main()
