import { SKIN_LIMITS, type SkinIssueCode } from '@shared/skins';
import type { ActiveSkin, SkinSummary, SkinsSetActiveResponse } from '@shared/ipc';
import type { Logger } from '../logging/logger';
import type { SkinAssetType } from './asset-inspect';
import {
  inspectAssetBytes,
  maxBytesFor,
  readConfinedFile,
  type SkinFs,
  type SkinPathApi,
} from './asset-files';
import { FOUNDATION_MANIFEST, FOUNDATION_SKIN_ID } from './foundation-manifest';
import type { SkinPreference } from './skin-preference';
import { scanSkinRoot, type SkinRecord } from './skin-scanner';
import type { SkinTokenStore } from './skin-tokens';

type FallbackReason = NonNullable<ActiveSkin['fallbackReason']>;
export type SetActiveData = Extract<SkinsSetActiveResponse, { ok: true }>['data'];
export type SkinChangeSource = 'renderer' | 'menu';

export interface SkinChange {
  readonly active: ActiveSkin;
  readonly source: SkinChangeSource;
}

export interface SkinsListData {
  readonly skins: SkinSummary[];
  readonly activeId: string;
}

export interface SkinMenuEntry {
  readonly id: string;
  readonly name: string;
  readonly enabled: boolean;
}

export interface SkinAssetBytes {
  readonly type: SkinAssetType;
  readonly bytes: Uint8Array;
}

export interface SkinService {
  /** Scans the roots and reads the stored preference. Never throws; failure leaves Foundation. */
  initialize(): Promise<void>;
  list(): SkinsListData;
  getActive(): ActiveSkin;
  setActive(skinId: string, source: SkinChangeSource): Promise<SetActiveData>;
  onChange(listener: (change: SkinChange) => void): () => void;
  /** For the native View menu. Foundation first, then by name. */
  menuEntries(): SkinMenuEntry[];
  /** Serves `media://skin/<token>`. Re-validates the file at call time. */
  readAsset(token: string): Promise<SkinAssetBytes | undefined>;
  /** Forgets every minted token (window closed). */
  clearTokens(): void;
}

export interface SkinServiceDeps {
  readonly fs: SkinFs;
  readonly pathApi: SkinPathApi;
  /** Absolute skin roots to scan. The builtin root is the only one enabled (ADR 0008). */
  readonly roots: readonly string[];
  readonly preference: SkinPreference;
  readonly tokens: SkinTokenStore;
  readonly log: Logger;
}

const FOUNDATION_SUMMARY: SkinSummary = {
  id: FOUNDATION_SKIN_ID,
  name: FOUNDATION_MANIFEST.name,
  version: FOUNDATION_MANIFEST.version,
  author: FOUNDATION_MANIFEST.author,
  description: FOUNDATION_MANIFEST.description,
  origin: 'embedded',
  status: 'ok',
  errorCodes: [],
};

const FOUNDATION_ACTIVE_BASE = { manifest: FOUNDATION_MANIFEST, assetUrls: {} } as const;

const urlFor = (token: string): string => `media://skin/${token}`;

export function createSkinService(deps: SkinServiceDeps): SkinService {
  const { fs, pathApi, roots, preference, tokens, log } = deps;
  const records = new Map<string, SkinRecord>();
  const listeners = new Set<(change: SkinChange) => void>();
  let activeId = FOUNDATION_SKIN_ID;
  let requestedId: string | null = null;
  let fallbackReason: FallbackReason | undefined = 'none-selected';

  const foundationActive = (
    reason: FallbackReason | undefined,
    requested: string | null,
  ): ActiveSkin => ({
    activeId: FOUNDATION_SKIN_ID,
    requestedId: requested,
    ...(reason === undefined ? {} : { fallbackReason: reason }),
    skin: { ...FOUNDATION_ACTIVE_BASE, assetUrls: {} },
  });

  const buildActive = (): ActiveSkin => {
    if (activeId === FOUNDATION_SKIN_ID) {
      return foundationActive(fallbackReason, requestedId);
    }
    const record = records.get(activeId);
    if (record === undefined || record.status !== 'ok' || record.manifest === null) {
      return foundationActive('load-failed', requestedId);
    }
    const assetUrls: Record<string, string> = {};
    for (const key of record.assets.keys()) {
      const token = tokens.mint(record.id, key);
      if (token === null) return foundationActive('load-failed', requestedId);
      assetUrls[key] = urlFor(token);
    }
    return {
      activeId: record.id,
      requestedId,
      ...(fallbackReason === undefined ? {} : { fallbackReason }),
      skin: { manifest: record.manifest, assetUrls },
    };
  };

  const summarize = (record: SkinRecord): SkinSummary => {
    const manifest = record.manifest;
    const base = {
      id: record.id,
      version: manifest?.version ?? '0.0.0',
      name: manifest?.name ?? record.id,
      author: manifest?.author ?? 'Unknown',
      description: manifest?.description ?? 'This skin could not be loaded.',
      origin: 'builtin' as const,
      status: record.status,
      errorCodes: [...record.errorCodes],
    };
    if (record.status === 'ok' && manifest?.preview !== undefined) {
      const token = tokens.mint(record.id, manifest.preview);
      if (token !== null) return { ...base, previewUrl: urlFor(token) };
    }
    return base;
  };

  const sortedRecords = (): SkinRecord[] =>
    [...records.values()].sort((a, b) => {
      const an = a.manifest?.name ?? a.id;
      const bn = b.manifest?.name ?? b.id;
      return an.localeCompare(bn) || a.id.localeCompare(b.id);
    });

  const resolveInitial = (stored: string | null): void => {
    requestedId = stored;
    activeId = FOUNDATION_SKIN_ID;
    if (stored === null) {
      fallbackReason = 'none-selected';
      return;
    }
    if (stored === FOUNDATION_SKIN_ID) {
      fallbackReason = undefined;
      return;
    }
    const record = records.get(stored);
    if (record === undefined) {
      fallbackReason = 'missing';
    } else if (record.status === 'incompatible') {
      fallbackReason = 'incompatible';
    } else if (record.status === 'invalid') {
      fallbackReason = 'invalid';
    } else {
      activeId = stored;
      fallbackReason = undefined;
    }
  };

  return {
    async initialize() {
      records.clear();
      try {
        const found: SkinRecord[] = [];
        for (const root of roots) found.push(...(await scanSkinRoot({ fs, pathApi, log }, root)));
        let okCount = 0;
        for (const record of found) {
          if (record.status === 'ok') {
            okCount += 1;
            if (okCount > SKIN_LIMITS.registeredSkins) {
              log.warn('skins.registration_limit', { code: 'STYLE_LIMIT' });
              continue;
            }
          }
          records.set(record.id, record);
        }
      } catch {
        records.clear();
        log.error('skins.scan_failed', { code: 'SCAN' });
      }
      let stored: string | null = null;
      try {
        stored = await preference.load();
      } catch {
        log.warn('skins.preference_read_failed', { code: 'UNKNOWN' });
      }
      resolveInitial(stored);
    },

    list() {
      const skins = [FOUNDATION_SUMMARY, ...sortedRecords().map(summarize)];
      return { skins, activeId };
    },

    getActive: buildActive,

    async setActive(skinId, source) {
      if (skinId !== FOUNDATION_SKIN_ID) {
        const record = records.get(skinId);
        if (record === undefined) return { applied: false, reason: 'unknown-skin' };
        if (record.status === 'incompatible') return { applied: false, reason: 'incompatible' };
        if (record.status !== 'ok') return { applied: false, reason: 'invalid' };
      }
      activeId = skinId;
      requestedId = skinId;
      fallbackReason = undefined;
      const persisted = await preference.save(skinId);
      const active = buildActive();
      for (const listener of [...listeners]) {
        try {
          listener({ active, source });
        } catch {
          log.warn('skins.listener_failed', { code: 'LISTENER' });
        }
      }
      return { applied: true, active, persisted };
    },

    onChange(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    menuEntries() {
      return [
        { id: FOUNDATION_SKIN_ID, name: FOUNDATION_MANIFEST.name, enabled: true },
        ...sortedRecords().map((record) => ({
          id: record.id,
          name: record.manifest?.name ?? record.id,
          enabled: record.status === 'ok',
        })),
      ];
    },

    async readAsset(token) {
      const target = tokens.resolve(token);
      if (target === undefined) return undefined;
      const record = records.get(target.skinId);
      if (record === undefined || record.status !== 'ok' || record.manifest === null) {
        return undefined;
      }
      const entry = record.assets.get(target.assetKey);
      if (entry === undefined) return undefined;
      try {
        const file = await readConfinedFile(
          fs,
          pathApi,
          record.rootPath,
          record.rootReal,
          entry.path,
          maxBytesFor(entry.type),
        );
        if (!file.ok) return undefined;
        const problem: SkinIssueCode | null = inspectAssetBytes(entry.type, file.bytes, {
          preview: target.assetKey === record.manifest.preview,
        });
        return problem === null ? { type: entry.type, bytes: file.bytes } : undefined;
      } catch {
        return undefined;
      }
    },

    clearTokens() {
      tokens.clear();
    },
  };
}
