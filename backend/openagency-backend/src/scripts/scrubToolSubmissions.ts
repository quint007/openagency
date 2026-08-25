import config from '@payload-config'
import { getPayload } from 'payload'

import {
  localModelCalculatorToolSlug,
  parseCalculatorMachineProfile,
} from '@/collections/ToolSubmissions'

const defaultScanLimit = 100
const maximumScanLimit = 1000

type ScrubSummary = {
  readonly apply: boolean
  readonly eligible: number
  readonly matched: number
  readonly remaining: number
  readonly scanned: number
  readonly skippedMalformed: number
  readonly updated: number
  readonly wouldUpdate: number
}

const parseScanLimit = (rawLimit: string | undefined): number => {
  if (rawLimit === undefined) return defaultScanLimit

  const parsed = Number(rawLimit)

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > maximumScanLimit) {
    throw new Error(`TOOL_SUBMISSION_SCRUB_LIMIT must be an integer from 1 to ${maximumScanLimit}.`)
  }

  return parsed
}

const jsonMatches = (left: unknown, right: unknown): boolean =>
  JSON.stringify(left) === JSON.stringify(right)

const main = async (): Promise<void> => {
  const apply = process.argv.includes('--apply')
  const limit = parseScanLimit(process.env.TOOL_SUBMISSION_SCRUB_LIMIT)
  const payload = await getPayload({ config })

  try {
    const records = await payload.find({
      collection: 'tool-submissions',
      depth: 0,
      limit,
      overrideAccess: true,
      where: {
        toolSlug: {
          equals: localModelCalculatorToolSlug,
        },
      },
    })
    let eligible = 0
    let skippedMalformed = 0
    let updated = 0
    let wouldUpdate = 0

    for (const record of records.docs) {
      const inputs = parseCalculatorMachineProfile(record.inputs)

      if (!inputs) {
        skippedMalformed += 1
        continue
      }

      eligible += 1

      if (jsonMatches(record.inputs, inputs) && jsonMatches(record.result, {})) {
        continue
      }

      wouldUpdate += 1

      if (!apply) continue

      await payload.update({
        collection: 'tool-submissions',
        data: {
          inputs,
          result: {},
        },
        id: record.id,
        overrideAccess: true,
      })
      updated += 1
    }

    const summary: ScrubSummary = {
      apply,
      eligible,
      matched: records.totalDocs,
      remaining: Math.max(0, records.totalDocs - records.docs.length),
      scanned: records.docs.length,
      skippedMalformed,
      updated,
      wouldUpdate,
    }

    console.log(JSON.stringify(summary))
  } finally {
    await payload.destroy()
  }
}

await main()
process.exit(0)
