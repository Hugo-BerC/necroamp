import {
  SKIN_LIMITS,
  readSchemaVersion,
  skinIdSchema,
  skinManifestSchema,
  type SkinIssueCode,
  type SkinManifest,
} from '@shared/skins';
import type { Logger } from '../logging/logger';
import type { SkinAssetType } from './asset-inspect';
import {
  inspectAssetBytes,
  isInside,
  maxBytesFor,
  readConfinedFile,
  type SkinFs,
  type SkinPathApi,
} from './asset-files';
import { FOUNDATION_SKIN_ID } from './foundation-manifest';
import { validateSkinSemantics } from './skin-semantics';

export type SkinRecordStatus = 'ok' | 'invalid' | 'incompatible';

export interface SkinAssetEntry {
  readonly path: string;
  readonly type: SkinAssetType;
}

/** Main-only record. The absolute paths never leave main. */
export interface SkinRecord {
  readonly id: string;
  readonly status: SkinRecordStatus;
  readonly errorCodes: readonly SkinIssueCode[];
  /** Present whenever the manifest passed the schema, even if a later check failed. */
  readonly manifest: SkinManifest | null;
  readonly rootPath: string;
  readonly rootReal: string;
  /** Declared assets, populated for every record whose manifest parsed. */
  readonly assets: ReadonlyMap<string, SkinAssetEntry>;
}

export interface ScannerDeps {
  readonly fs: SkinFs;
  readonly pathApi: SkinPathApi;
  readonly log: Logger;
}

export const MANIFEST_FILE = 'skin.json';

function capCodes(codes: Iterable<SkinIssueCode>): SkinIssueCode[] {
  return [...new Set(codes)].slice(0, SKIN_LIMITS.errorCodesPerSkin);
}

function failed(
  id: string,
  status: SkinRecordStatus,
  codes: Iterable<SkinIssueCode>,
  rootPath: string,
  rootReal: string,
  manifest: SkinManifest | null = null,
): SkinRecord {
  return {
    id,
    status,
    errorCodes: capCodes(codes),
    manifest,
    rootPath,
    rootReal,
    assets: new Map(),
  };
}

async function scanOne(
  deps: ScannerDeps,
  rootsReal: string,
  rootPath: string,
  id: string,
): Promise<SkinRecord> {
  const { fs, pathApi } = deps;
  const dirReal = await (async (): Promise<string | SkinIssueCode> => {
    try {
      const stats = await fs.lstat(rootPath);
      if (stats.isSymbolicLink()) return 'FILE_SYMLINK';
      if (!stats.isDirectory()) return 'FILE_MISSING';
      const real = await fs.realpath(rootPath);
      return isInside(pathApi, rootsReal, real) ? real : 'FILE_ESCAPE';
    } catch {
      return 'FILE_MISSING';
    }
  })();
  if (dirReal === 'FILE_SYMLINK' || dirReal === 'FILE_ESCAPE' || dirReal === 'FILE_MISSING') {
    return failed(id, 'invalid', [dirReal], rootPath, rootPath);
  }
  const fail = (status: SkinRecordStatus, codes: SkinIssueCode[], manifest?: SkinManifest) =>
    failed(id, status, codes, rootPath, dirReal, manifest ?? null);

  const read = await readConfinedFile(
    fs,
    pathApi,
    rootPath,
    dirReal,
    MANIFEST_FILE,
    SKIN_LIMITS.manifestBytes,
  );
  if (!read.ok)
    return fail('invalid', [read.code === 'FILE_TOO_LARGE' ? 'MANIFEST_TOO_LARGE' : read.code]);
  let json: unknown;
  try {
    json = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(read.bytes));
  } catch {
    return fail('invalid', ['JSON_PARSE']);
  }
  const version = readSchemaVersion(json);
  if (version !== null && version !== 1) return fail('incompatible', ['SCHEMA_VERSION']);
  const parsed = skinManifestSchema.safeParse(json);
  if (!parsed.success) return fail('invalid', ['SCHEMA']);
  const manifest = parsed.data;
  const codes: SkinIssueCode[] = [];
  if (manifest.id !== id) codes.push('ID_MISMATCH');
  codes.push(...validateSkinSemantics(manifest).map((issue) => issue.code));

  const assets = new Map<string, SkinAssetEntry>();
  let total = 0;
  for (const key of Object.keys(manifest.assets).sort()) {
    const decl = manifest.assets[key];
    if (decl === undefined) continue;
    assets.set(key, { path: decl.path, type: decl.type });
    const file = await readConfinedFile(
      fs,
      pathApi,
      rootPath,
      dirReal,
      decl.path,
      maxBytesFor(decl.type),
    );
    if (!file.ok) {
      codes.push(file.code);
      continue;
    }
    total += file.bytes.byteLength;
    const problem = inspectAssetBytes(decl.type, file.bytes, { preview: key === manifest.preview });
    if (problem !== null) codes.push(problem);
  }
  if (total > SKIN_LIMITS.totalAssetBytes) codes.push('TOTAL_TOO_LARGE');
  if (codes.length > 0) {
    return { ...fail('invalid', codes, manifest), assets };
  }
  return {
    id,
    status: 'ok',
    errorCodes: [],
    manifest,
    rootPath,
    rootReal: dirReal,
    assets,
  };
}

/**
 * Scans one skin root. A missing root yields an empty list. Never throws. At most
 * `SKIN_LIMITS.skinsScanned` directories are examined, in sorted order.
 */
export async function scanSkinRoot(deps: ScannerDeps, rootPath: string): Promise<SkinRecord[]> {
  const { fs, pathApi, log } = deps;
  let rootReal: string;
  let names: string[];
  try {
    rootReal = await fs.realpath(rootPath);
    names = await fs.readdir(rootPath);
  } catch {
    log.info('skins.root_unavailable', { code: 'ROOT' });
    return [];
  }
  const candidates = names
    .filter((name) => name !== FOUNDATION_SKIN_ID && skinIdSchema.safeParse(name).success)
    .sort()
    .slice(0, SKIN_LIMITS.skinsScanned);
  const records: SkinRecord[] = [];
  for (const name of candidates) {
    try {
      const record = await scanOne(deps, rootReal, pathApi.join(rootPath, name), name);
      if (record.status !== 'ok') {
        log.warn('skins.scan_rejected', { code: record.errorCodes[0] ?? 'UNKNOWN' });
      }
      records.push(record);
    } catch {
      records.push(failed(name, 'invalid', ['FILE_MISSING'], rootPath, rootPath));
      log.warn('skins.scan_rejected', { code: 'IO' });
    }
  }
  return records;
}
