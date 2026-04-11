// @vitest-environment node

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, expect, test, vi } from 'vitest';

const frontendRoot = process.cwd();
const cmsClientEntryPath = path.join(frontendRoot, 'packages/cms-client/src/index.ts');

afterEach(() => {
  vi.resetModules();
  vi.doUnmock('server-only');
  vi.unstubAllGlobals();
});

test('cms-client marks its public surface as server-only', () => {
  const source = readFileSync(cmsClientEntryPath, 'utf8');

  expect(source).toMatch(/^import 'server-only';/);
});

test('cms-client rejects browser-context imports', async () => {
  vi.doMock('server-only', () => ({}));
  vi.stubGlobal('window', {});

  await expect(import('../src/index')).rejects.toThrow(
    '@open-agency/cms-client must only be imported from server-side modules.',
  );
});
