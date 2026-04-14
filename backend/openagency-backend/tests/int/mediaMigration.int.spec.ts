import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { runMediaMigration } from '@/utilities/mediaMigration'

describe('media migration runner', () => {
  const readFile = vi.fn()
  const stat = vi.fn()
  const verifyUrl = vi.fn()
  const uploadMediaFile = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('migrates legacy files and verifies a representative cutover URL', async () => {
    const migratedDoc = {
      filename: 'hero.webp',
      id: 'media-1',
      mimeType: 'image/webp',
      url: 'https://cdn.example.com/hero.webp',
    }

    stat.mockResolvedValue({
      isFile: () => true,
    })
    readFile.mockResolvedValue(Buffer.from('legacy-image'))
    verifyUrl.mockResolvedValueOnce({
      ok: false,
      status: 404,
      url: 'https://cdn.example.com/hero.webp',
    })
    verifyUrl.mockResolvedValueOnce({
      ok: true,
      status: 200,
      url: 'https://cdn.example.com/hero.webp',
    })
    uploadMediaFile.mockResolvedValue(migratedDoc)

    const summary = await runMediaMigration({
      adapter: {
        listMedia: async () => [
          {
            filename: 'hero.webp',
            id: 'media-1',
            mimeType: 'image/webp',
            url: '/media/hero.webp',
          },
        ],
        uploadMediaFile,
      },
      legacyDirectory: '/legacy/media',
      publicBaseUrl: 'https://cdn.example.com',
      readFile,
      stat,
      verifyUrl,
    })

    expect(uploadMediaFile).toHaveBeenCalledWith({
      doc: {
        filename: 'hero.webp',
        id: 'media-1',
        mimeType: 'image/webp',
        url: '/media/hero.webp',
      },
      file: expect.objectContaining({
        mimetype: 'image/webp',
        name: 'hero.webp',
        size: Buffer.byteLength('legacy-image'),
      }),
    })
    expect(summary).toEqual({
      failedCount: 0,
      failures: [],
      legacyDirectory: '/legacy/media',
      migratedCount: 1,
      mode: 'migrated',
      skippedCount: 0,
      totalCount: 1,
      verifiedAsset: {
        id: 'media-1',
        status: 200,
        url: 'https://cdn.example.com/hero.webp',
      },
    })
  })

  it('exits cleanly as a no-op when media is already cut over and readable', async () => {
    verifyUrl.mockResolvedValue({
      ok: true,
      status: 200,
      url: 'https://cdn.example.com/hero.webp',
    })

    const summary = await runMediaMigration({
      adapter: {
        listMedia: async () => [
          {
            filename: 'hero.webp',
            id: 'media-1',
            mimeType: 'image/webp',
            url: 'https://cdn.example.com/hero.webp',
          },
        ],
        uploadMediaFile,
      },
      legacyDirectory: '/legacy/media',
      publicBaseUrl: 'https://cdn.example.com',
      readFile,
      stat,
      verifyUrl,
    })

    expect(uploadMediaFile).not.toHaveBeenCalled()
    expect(readFile).not.toHaveBeenCalled()
    expect(summary).toEqual({
      failedCount: 0,
      failures: [],
      legacyDirectory: '/legacy/media',
      migratedCount: 0,
      mode: 'noop',
      skippedCount: 1,
      totalCount: 1,
      verifiedAsset: {
        id: 'media-1',
        status: 200,
        url: 'https://cdn.example.com/hero.webp',
      },
    })
  })
})
