import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { expect, test } from 'vitest'

const frontendRoot = process.cwd()
const repoRoot = path.dirname(frontendRoot)

const sanctionedBoundaryFile = path.join(repoRoot, 'backend/openagency-backend/src/payload-types-public.ts')
const generatedPayloadTypesPath = 'backend/openagency-backend/src/payload-types'

function listSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'dist') {
        return []
      }

      return listSourceFiles(entryPath)
    }

    return /\.(cjs|cts|js|jsx|mjs|mts|ts|tsx)$/.test(entry.name) ? [entryPath] : []
  })
}

test('generated Payload types stay behind the backend-owned import surface', () => {
  const boundarySource = readFileSync(sanctionedBoundaryFile, 'utf8')
  const frontendFiles = listSourceFiles(frontendRoot)
  const currentTestFile = path.join(frontendRoot, 'packages/api-client/tests/cms-type-boundary.test.ts')

  expect(boundarySource).toContain("export type * from './payload-types'")

  const deepImportCallsites = frontendFiles.filter((filePath) => {
    if (filePath === currentTestFile) {
      return false
    }

    const source = readFileSync(filePath, 'utf8')
    return source.includes(generatedPayloadTypesPath)
  }).sort()

  expect(deepImportCallsites).toEqual([])
})

test('OA-15 inventory artifact documents app findings and the backend type boundary', () => {
  const inventoryPath = path.join(frontendRoot, 'cms-callsite-inventory.md')
  const inventory = readFileSync(inventoryPath, 'utf8')

  expect(inventory).toContain('`frontend/apps/marketing`: no direct Payload REST consumers found.')
  expect(inventory).toContain('`frontend/apps/courses`: no direct Payload REST consumers found.')
  expect(inventory).toContain('`frontend/apps/marketing/src/app/components/homepage/LatestGuidesSection.tsx` remains a static seam, not a live CMS call.')
  expect(inventory).toContain('`backend/openagency-backend/src/payload-types-public.ts`')
  expect(inventory).not.toContain('@open-agency/api-client/payload-types')
})
