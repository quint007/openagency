// @vitest-environment node

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const appRoot = path.resolve(import.meta.dirname, '../src/app');
const sourceFilePattern = /\.(ts|tsx)$/;
const forbiddenPatterns = [
  /\bfetch\s*\(/,
  /\/api\/(authors|blog-posts|courses|lessons)\b/,
  /PAYLOAD_API_URL/,
  /PAYLOAD_API_KEY/,
  /NEXT_PUBLIC_API_URL/,
];

async function collectSourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return collectSourceFiles(entryPath);
      }

      return sourceFilePattern.test(entry.name) ? [entryPath] : [];
    }),
  );

  return files.flat();
}

describe('marketing app source boundary', () => {
  test('app router files do not contain direct Payload REST call patterns', async () => {
    const sourceFiles = await collectSourceFiles(appRoot);
    const violations: string[] = [];

    for (const filePath of sourceFiles) {
      const contents = await readFile(filePath, 'utf8');
      const relativePath = path.relative(appRoot, filePath);

      // This private, service-authenticated command client is the newsletter boundary.
      if (relativePath === 'newsletter/service-client.ts') continue;

      for (const pattern of forbiddenPatterns) {
        if (relativePath === 'feedback/actions.ts' && pattern === forbiddenPatterns[0]) {
          continue;
        }

        if (pattern.test(contents)) {
          violations.push(`${relativePath} matched ${pattern}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
