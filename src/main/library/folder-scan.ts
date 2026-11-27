import { audioTypeFor } from '../protocol/media-handler';

/** Bounds for one folder discovery. Directory depth 0 is the chosen folder itself. */
export const FOLDER_SCAN_LIMITS = Object.freeze({
  maxDepth: 8,
  /** Directory entries inspected in total, files and directories, so a huge tree stays cheap. */
  maxEntries: 50_000,
});

export interface FolderDirent {
  readonly name: string;
  isFile(): boolean;
  isDirectory(): boolean;
  isSymbolicLink(): boolean;
}

export interface FolderScanDeps {
  readonly fs: {
    readdir(path: string): Promise<readonly FolderDirent[]>;
    realpath(path: string): Promise<string>;
  };
  readonly path: {
    join(...parts: string[]): string;
    extname(path: string): string;
    sep: string;
  };
  /** Stops discovery once this many files are found. */
  readonly maxFiles: number;
  readonly maxDepth?: number;
  readonly maxEntries?: number;
}

export interface FolderScanResult {
  /** Absolute paths. They stay in main. */
  readonly files: readonly string[];
  readonly truncated: boolean;
}

const COLLATOR = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

/** Natural order ("2" before "10"), with a code-unit tie-break so the order is total. */
export function compareNatural(a: string, b: string): number {
  const natural = COLLATOR.compare(a, b);
  if (natural !== 0) return natural;
  if (a < b) return -1;
  return a > b ? 1 : 0;
}

/**
 * Discovers supported audio files under `root` (an already user-chosen directory).
 * Symbolic links and junctions are never followed or listed (Dirent reports both as links),
 * and each subdirectory's real path must stay inside the real root. Files are listed before
 * sub-directories of the same folder, each group in natural order. Throws only if the root
 * itself cannot be read. An unreadable sub-directory is skipped.
 */
export async function scanFolder(root: string, deps: FolderScanDeps): Promise<FolderScanResult> {
  const { fs, path, maxFiles } = deps;
  const maxDepth = deps.maxDepth ?? FOLDER_SCAN_LIMITS.maxDepth;
  let budget = deps.maxEntries ?? FOLDER_SCAN_LIMITS.maxEntries;
  const realRoot = await fs.realpath(root);
  const files: string[] = [];
  let truncated = false;

  const inside = (real: string): boolean =>
    real === realRoot ||
    real.startsWith(realRoot.endsWith(path.sep) ? realRoot : realRoot + path.sep);

  async function walk(dir: string, depth: number, isRoot: boolean): Promise<void> {
    let entries: readonly FolderDirent[];
    try {
      entries = await fs.readdir(dir);
    } catch (error) {
      if (isRoot) throw error;
      return;
    }
    const sorted = [...entries].sort((a, b) => compareNatural(a.name, b.name));
    const dirs: FolderDirent[] = [];
    for (const entry of sorted) {
      if (budget <= 0) {
        truncated = true;
        return;
      }
      budget -= 1;
      if (entry.isSymbolicLink()) continue;
      if (entry.isFile()) {
        if (audioTypeFor(path.extname(entry.name)) === undefined) continue;
        if (files.length >= maxFiles) {
          truncated = true;
          return;
        }
        files.push(path.join(dir, entry.name));
      } else if (entry.isDirectory()) {
        dirs.push(entry);
      }
    }
    for (const entry of dirs) {
      if (truncated) return;
      if (depth + 1 > maxDepth) {
        truncated = true;
        continue;
      }
      const child = path.join(dir, entry.name);
      try {
        if (!inside(await fs.realpath(child))) continue;
      } catch {
        continue;
      }
      await walk(child, depth + 1, false);
    }
  }

  await walk(root, 0, true);
  return { files, truncated };
}
