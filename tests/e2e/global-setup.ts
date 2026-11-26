import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

// T7.1: fail fast when the production build is missing or older than the sources it was built from.
const root = path.resolve(__dirname, '..', '..');
const REQUIRED = ['out/main/index.js', 'out/preload/index.js', 'out/renderer/index.html'];

function newestSourceMtime(dir: string): number {
  let newest = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true, recursive: true })) {
    if (!entry.isFile() || /\.(test|d)\.tsx?$/.test(entry.name)) continue;
    newest = Math.max(newest, statSync(path.join(entry.parentPath, entry.name)).mtimeMs);
  }
  return newest;
}

export default function globalSetup(): void {
  const missing = REQUIRED.filter((file) => !existsSync(path.join(root, file)));
  if (missing.length > 0) {
    throw new Error(`Missing build output (${missing.join(', ')}). Run "pnpm build" first.`);
  }
  const oldestBuild = Math.min(...REQUIRED.map((f) => statSync(path.join(root, f)).mtimeMs));
  const sources = ['src', 'electron.vite.config.ts'].map((p) => path.join(root, p));
  const newestSource = Math.max(
    newestSourceMtime(sources[0] as string),
    statSync(sources[1] as string).mtimeMs,
  );
  if (newestSource > oldestBuild) {
    throw new Error('The build in out/ is older than the sources. Run "pnpm build" first.');
  }
}
