import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const repoRoot = path.resolve(new URL('..', import.meta.url).pathname, '..');
const frontendRoot = path.join(repoRoot, 'frontend');
const evidenceDir = path.join(repoRoot, '.sisyphus/evidence');
const successEvidencePath = path.join(evidenceDir, 'task-8-client-boundary.txt');
const failureEvidencePath = path.join(evidenceDir, 'task-8-client-boundary-error.txt');
const appChecks = [
  {
    appName: 'marketing',
    appRoot: path.join(frontendRoot, 'apps/marketing/src/app'),
  },
  {
    appName: 'courses',
    appRoot: path.join(frontendRoot, 'apps/courses/src/app'),
  },
];
const buildAssetRoots = [
  path.join(frontendRoot, 'apps/marketing/.next/static'),
  path.join(frontendRoot, 'apps/courses/.next/static'),
];
const sourceFilePattern = /\.(ts|tsx)$/;
const textAssetPattern = /\.(css|html|js|json|map|txt)$/;
const forbiddenSourcePatterns = [
  /\bfetch\s*\(/,
  /\/api\/(authors|blog-posts|courses|lessons)\b/,
  /PAYLOAD_API_URL/,
  /PAYLOAD_API_KEY/,
  /NEXT_PUBLIC_API_URL/,
];

function getSecretNeedles() {
  const needles = [
    { label: 'env name REVALIDATE_SECRET', value: 'REVALIDATE_SECRET' },
  ];

  if (process.env.REVALIDATE_SECRET) {
    needles.push({ label: 'REVALIDATE_SECRET value', value: process.env.REVALIDATE_SECRET });
  }

  return needles;
}

async function ensureEvidenceDir() {
  await mkdir(evidenceDir, { recursive: true });
}

async function collectFiles(directory, matcher) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return collectFiles(entryPath, matcher);
      }

      return matcher.test(entry.name) ? [entryPath] : [];
    }),
  );

  return files.flat();
}

async function verifySourceBoundaries() {
  const violations = [];
  const summaries = [];

  for (const { appName, appRoot } of appChecks) {
    const sourceFiles = await collectFiles(appRoot, sourceFilePattern);
    summaries.push(`- ${appName}: scanned ${sourceFiles.length} app-router source files under ${path.relative(repoRoot, appRoot)}`);

    for (const filePath of sourceFiles) {
      const contents = await readFile(filePath, 'utf8');

      for (const pattern of forbiddenSourcePatterns) {
        if (pattern.test(contents)) {
          violations.push(`${path.relative(repoRoot, filePath)} matched ${pattern}`);
        }
      }
    }
  }

  return { summaries, violations };
}

async function verifyClientAssets() {
  const violations = [];
  const summaries = [];
  const secretNeedles = getSecretNeedles();

  for (const assetRoot of buildAssetRoots) {
    const assetRootStat = await stat(assetRoot).catch(() => null);

    if (!assetRootStat?.isDirectory()) {
      violations.push(`Missing client asset directory: ${path.relative(repoRoot, assetRoot)}. Run frontend build first.`);
      continue;
    }

    const assetFiles = await collectFiles(assetRoot, textAssetPattern);
    summaries.push(`- ${path.relative(repoRoot, assetRoot)}: scanned ${assetFiles.length} built client assets`);

    for (const filePath of assetFiles) {
      const contents = await readFile(filePath, 'utf8');

      for (const needle of secretNeedles) {
        if (needle.value && contents.includes(needle.value)) {
          violations.push(`${path.relative(repoRoot, filePath)} exposed ${needle.label}`);
        }
      }
    }
  }

  return { summaries, violations };
}

function createReport({ sourceSummary, sourceViolations, assetSummary, assetViolations }) {
  return [
    'Task 8 — client boundary verification',
    '',
    'Source guard summary:',
    ...sourceSummary,
    '',
    'Client asset summary:',
    ...assetSummary,
    '',
    sourceViolations.length === 0 && assetViolations.length === 0
      ? 'Result: passed — no direct Payload REST patterns found in either app and no secrets found in built client assets.'
      : 'Result: failed',
    ...(sourceViolations.length > 0 ? ['', 'Source violations:', ...sourceViolations] : []),
    ...(assetViolations.length > 0 ? ['', 'Client asset violations:', ...assetViolations] : []),
    '',
    `Generated at: ${new Date().toISOString()}`,
  ].join('\n');
}

async function main() {
  await ensureEvidenceDir();
  const sourceResult = await verifySourceBoundaries();
  const assetResult = await verifyClientAssets();
  const report = createReport({
    assetSummary: assetResult.summaries,
    assetViolations: assetResult.violations,
    sourceSummary: sourceResult.summaries,
    sourceViolations: sourceResult.violations,
  });
  const hasViolations = sourceResult.violations.length > 0 || assetResult.violations.length > 0;

  if (hasViolations) {
    await writeFile(failureEvidencePath, `${report}\n`, 'utf8');
    await rm(successEvidencePath, { force: true });
    throw new Error(report);
  }

  await writeFile(successEvidencePath, `${report}\n`, 'utf8');
  await rm(failureEvidencePath, { force: true });
  process.stdout.write(`${report}\n`);
}

await main();
