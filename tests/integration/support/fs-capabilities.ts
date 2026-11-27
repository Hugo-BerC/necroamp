import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

/**
 * Synchronous capability probe so tests can use `it.skipIf(!SYMLINKS_PERMITTED)`. Creating a file
 * symlink needs a privilege or Developer Mode on Windows; on macOS and Linux it always works. The
 * probe touches only a private temporary directory and removes it.
 */
function probeSymlinks(): boolean {
  const dir = mkdtempSync(path.join(tmpdir(), 'necroamp-symprobe-'));
  try {
    writeFileSync(path.join(dir, 'target'), 'x');
    symlinkSync(path.join(dir, 'target'), path.join(dir, 'link'), 'file');
    return true;
  } catch {
    return false;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export const SYMLINKS_PERMITTED: boolean = probeSymlinks();
export const SYMLINK_SKIP_REASON =
  'needs file symlink creation (Windows: Developer Mode or elevated). The junction and mocked-realpath tests cover the same boundary without privilege.';
