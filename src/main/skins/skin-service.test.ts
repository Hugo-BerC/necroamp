import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { activeSkinSchema, skinSummarySchema } from '@shared/ipc';
import type { SkinManifest } from '@shared/skins';
import type { SkinFs } from './asset-files';
import { FOUNDATION_MANIFEST } from './foundation-manifest';
import { createSkinPreference, type SkinPreference } from './skin-preference';
import { createSkinService, type SkinService } from './skin-service';
import { createSkinTokenStore } from './skin-tokens';

const NS = 'xmlns="http://www.w3.org/2000/svg"';
const SVG_OK = `<svg ${NS} viewBox="0 0 8 8"><rect width="8" height="8"/></svg>`;
const URL_RE = /^media:\/\/skin\/[0-9a-f-]{36}$/;

function png(): Uint8Array {
  const bytes = new Uint8Array(40);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  bytes.set([0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52], 8);
  new DataView(bytes.buffer).setUint32(16, 10);
  new DataView(bytes.buffer).setUint32(20, 10);
  return bytes;
}

function manifest(id: string, name: string): SkinManifest {
  const m = structuredClone(FOUNDATION_MANIFEST);
  m.id = id;
  m.name = name;
  m.assets = {
    bg: { path: 'assets/bg.svg', type: 'svg' },
    tex: { path: 'assets/tex.png', type: 'png' },
  };
  m.preview = 'tex';
  m.surfaces['app'] = {
    layers: [{ asset: 'bg', size: 'cover', position: 'center', opacity: 1, blend: 'normal' }],
    shadow: 'none',
  };
  return m;
}

const nodeFs: SkinFs = {
  lstat: (p) => fs.lstat(p),
  realpath: (p) => fs.realpath(p),
  readdir: (p) => fs.readdir(p),
  readFile: (p) => fs.readFile(p),
};

const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
let base: string;
let root: string;
let prefFile: string;

async function writeSkin(id: string, name = id, edit?: (m: SkinManifest) => void): Promise<void> {
  const dir = path.join(root, id);
  const m = manifest(id, name);
  edit?.(m);
  await fs.mkdir(path.join(dir, 'assets'), { recursive: true });
  await fs.writeFile(path.join(dir, 'skin.json'), JSON.stringify(m));
  await fs.writeFile(path.join(dir, 'assets', 'bg.svg'), SVG_OK);
  await fs.writeFile(path.join(dir, 'assets', 'tex.png'), png());
}

const realPreference = (): SkinPreference =>
  createSkinPreference({
    fs: {
      readFile: (p) => fs.readFile(p, 'utf8'),
      writeFile: (p, d) => fs.writeFile(p, d, 'utf8'),
      rename: (a, b) => fs.rename(a, b),
      rm: (p) => fs.rm(p, { force: true }),
    },
    filePath: prefFile,
    log,
  });

function service(preference: SkinPreference = realPreference()): SkinService {
  return createSkinService({
    fs: nodeFs,
    pathApi: path,
    roots: [root],
    preference,
    tokens: createSkinTokenStore(),
    log,
  });
}

beforeEach(async () => {
  base = await fs.mkdtemp(path.join(os.tmpdir(), 'necroamp-svc-'));
  root = path.join(base, 'skins');
  prefFile = path.join(base, 'skin-preference.json');
  await fs.mkdir(root, { recursive: true });
  vi.clearAllMocks();
});

afterEach(async () => {
  await fs.rm(base, { recursive: true, force: true });
});

describe('startup resolution and fallback', () => {
  it('uses Foundation with none-selected when nothing is stored', async () => {
    await writeSkin('alpha');
    const svc = service();
    await svc.initialize();
    const active = svc.getActive();
    expect(active).toMatchObject({
      activeId: 'foundation',
      requestedId: null,
      fallbackReason: 'none-selected',
    });
    expect(active.skin.assetUrls).toEqual({});
    expect(activeSkinSchema.safeParse(active).success).toBe(true);
  });

  it('applies a stored valid skin with minted asset URLs and no fallback reason', async () => {
    await writeSkin('alpha', 'Alpha');
    await fs.writeFile(prefFile, JSON.stringify({ schemaVersion: 1, skinId: 'alpha' }));
    const svc = service();
    await svc.initialize();
    const active = svc.getActive();
    expect(active.activeId).toBe('alpha');
    expect(active.requestedId).toBe('alpha');
    expect(active.fallbackReason).toBeUndefined();
    expect(Object.keys(active.skin.assetUrls).sort()).toEqual(['bg', 'tex']);
    for (const url of Object.values(active.skin.assetUrls)) expect(url).toMatch(URL_RE);
    expect(activeSkinSchema.safeParse(active).success).toBe(true);
    // The same asset keeps its token for the session.
    expect(svc.getActive().skin.assetUrls).toEqual(active.skin.assetUrls);
  });

  it('keeps Foundation without a reason when Foundation itself was stored', async () => {
    await fs.writeFile(prefFile, JSON.stringify({ schemaVersion: 1, skinId: 'foundation' }));
    const svc = service();
    await svc.initialize();
    const active = svc.getActive();
    expect(active.activeId).toBe('foundation');
    expect(active.requestedId).toBe('foundation');
    expect(active.fallbackReason).toBeUndefined();
  });

  it('falls back with reason missing when the stored skin is gone', async () => {
    await fs.writeFile(prefFile, JSON.stringify({ schemaVersion: 1, skinId: 'deleted-skin' }));
    const svc = service();
    await svc.initialize();
    expect(svc.getActive()).toMatchObject({
      activeId: 'foundation',
      requestedId: 'deleted-skin',
      fallbackReason: 'missing',
    });
  });

  it('falls back with reason invalid when the stored skin fails validation', async () => {
    await writeSkin('broken');
    await fs.writeFile(path.join(root, 'broken', 'assets', 'bg.svg'), '<svg><script/></svg>');
    await fs.writeFile(prefFile, JSON.stringify({ schemaVersion: 1, skinId: 'broken' }));
    const svc = service();
    await svc.initialize();
    expect(svc.getActive()).toMatchObject({
      activeId: 'foundation',
      requestedId: 'broken',
      fallbackReason: 'invalid',
    });
  });

  it('falls back with reason incompatible for an unknown schemaVersion', async () => {
    await fs.mkdir(path.join(root, 'newer'));
    await fs.writeFile(
      path.join(root, 'newer', 'skin.json'),
      JSON.stringify({ ...manifest('newer', 'Newer'), schemaVersion: 9 }),
    );
    await fs.writeFile(prefFile, JSON.stringify({ schemaVersion: 1, skinId: 'newer' }));
    const svc = service();
    await svc.initialize();
    expect(svc.getActive().fallbackReason).toBe('incompatible');
  });

  it('does not rewrite the preference on fallback, so a repaired skin returns next start', async () => {
    await writeSkin('flaky');
    await fs.writeFile(path.join(root, 'flaky', 'assets', 'bg.svg'), 'not svg');
    await fs.writeFile(prefFile, JSON.stringify({ schemaVersion: 1, skinId: 'flaky' }));
    const first = service();
    await first.initialize();
    expect(first.getActive().activeId).toBe('foundation');
    expect(JSON.parse(await fs.readFile(prefFile, 'utf8')).skinId).toBe('flaky');
    await fs.writeFile(path.join(root, 'flaky', 'assets', 'bg.svg'), SVG_OK);
    const second = service();
    await second.initialize();
    expect(second.getActive().activeId).toBe('flaky');
  });

  it.each([['{broken'], ['{"schemaVersion":3,"skinId":"alpha"}'], ['{"skinId":"../alpha"}']])(
    'treats a corrupt preference %s as none-selected',
    async (body) => {
      await writeSkin('alpha');
      await fs.writeFile(prefFile, body);
      const svc = service();
      await svc.initialize();
      expect(svc.getActive()).toMatchObject({
        activeId: 'foundation',
        fallbackReason: 'none-selected',
      });
    },
  );

  it('stays on Foundation when the roots do not exist', async () => {
    const svc = createSkinService({
      fs: nodeFs,
      pathApi: path,
      roots: [path.join(base, 'nope')],
      preference: realPreference(),
      tokens: createSkinTokenStore(),
      log,
    });
    await svc.initialize();
    expect(svc.list().skins.map((s) => s.id)).toEqual(['foundation']);
  });

  it('survives a preference reader that throws', async () => {
    const throwing: SkinPreference = {
      load: () => Promise.reject(new Error('C:\\secret')),
      save: () => Promise.resolve(true),
    };
    const svc = service(throwing);
    await svc.initialize();
    expect(svc.getActive().activeId).toBe('foundation');
  });

  it('survives a scan whose path handling throws', async () => {
    const svc = createSkinService({
      fs: nodeFs,
      pathApi: {
        ...path,
        join: () => {
          throw new Error('x');
        },
      },
      roots: [root],
      preference: realPreference(),
      tokens: createSkinTokenStore(),
      log,
    });
    await writeSkin('alpha');
    await expect(svc.initialize()).resolves.toBeUndefined();
    expect(svc.getActive().activeId).toBe('foundation');
  });

  it('registers at most eight valid skins', async () => {
    for (let i = 0; i < 10; i += 1) await writeSkin(`skin-${String.fromCharCode(97 + i)}`);
    const svc = service();
    await svc.initialize();
    expect(svc.list().skins.filter((s) => s.id !== 'foundation')).toHaveLength(8);
    expect(log.warn).toHaveBeenCalledWith('skins.registration_limit', { code: 'STYLE_LIMIT' });
  });
});

describe('list', () => {
  it('lists Foundation first, then skins by name, with a preview URL for ok skins', async () => {
    await writeSkin('zeta', 'Alpha Skin');
    await writeSkin('beta', 'Zulu Skin');
    const svc = service();
    await svc.initialize();
    const { skins, activeId } = svc.list();
    expect(activeId).toBe('foundation');
    expect(skins.map((s) => s.id)).toEqual(['foundation', 'zeta', 'beta']);
    expect(skins[0]).toMatchObject({ origin: 'embedded', status: 'ok', errorCodes: [] });
    expect(skins[1]?.previewUrl).toMatch(URL_RE);
    for (const skin of skins) expect(skinSummarySchema.safeParse(skin).success).toBe(true);
  });

  it('lists invalid and incompatible skins with codes and fixed fallback strings', async () => {
    await fs.mkdir(path.join(root, 'junk'));
    await fs.writeFile(path.join(root, 'junk', 'skin.json'), '{nope');
    await fs.mkdir(path.join(root, 'newer'));
    await fs.writeFile(path.join(root, 'newer', 'skin.json'), '{"schemaVersion":2}');
    const svc = service();
    await svc.initialize();
    const byId = Object.fromEntries(svc.list().skins.map((s) => [s.id, s]));
    expect(byId['junk']).toEqual({
      id: 'junk',
      name: 'junk',
      version: '0.0.0',
      author: 'Unknown',
      description: 'This skin could not be loaded.',
      origin: 'builtin',
      status: 'invalid',
      errorCodes: ['JSON_PARSE'],
    });
    expect(byId['newer']).toMatchObject({ status: 'incompatible', errorCodes: ['SCHEMA_VERSION'] });
    for (const skin of Object.values(byId))
      expect(skinSummarySchema.safeParse(skin).success).toBe(true);
  });

  it('exposes no absolute path anywhere in listings or the active skin', async () => {
    await writeSkin('alpha');
    await fs.mkdir(path.join(root, 'junk'));
    const svc = service();
    await svc.initialize();
    await svc.setActive('alpha', 'renderer');
    const text = JSON.stringify([svc.list(), svc.getActive()]);
    expect(text).not.toContain(base);
    expect(text).not.toContain(base.replaceAll('\\', '\\\\'));
  });
});

describe('setActive', () => {
  it('applies, persists and notifies listeners with the source', async () => {
    await writeSkin('alpha');
    const svc = service();
    await svc.initialize();
    const events: [string, string][] = [];
    const off = svc.onChange(({ active, source }) => events.push([active.activeId, source]));
    const result = await svc.setActive('alpha', 'menu');
    expect(result).toMatchObject({ applied: true, persisted: true });
    expect(result.applied && result.active.activeId).toBe('alpha');
    expect(JSON.parse(await fs.readFile(prefFile, 'utf8'))).toEqual({
      schemaVersion: 1,
      skinId: 'alpha',
    });
    expect(events).toEqual([['alpha', 'menu']]);
    off();
    await svc.setActive('foundation', 'renderer');
    expect(events).toHaveLength(1);
  });

  it('survives a restart: the chosen skin is active again', async () => {
    await writeSkin('alpha');
    const first = service();
    await first.initialize();
    await first.setActive('alpha', 'renderer');
    const second = service();
    await second.initialize();
    expect(second.getActive()).toMatchObject({ activeId: 'alpha', requestedId: 'alpha' });
  });

  it('allows returning to Foundation and persists it', async () => {
    await writeSkin('alpha');
    const svc = service();
    await svc.initialize();
    await svc.setActive('alpha', 'renderer');
    const result = await svc.setActive('foundation', 'renderer');
    expect(result).toMatchObject({ applied: true, persisted: true });
    expect(svc.getActive()).toMatchObject({ activeId: 'foundation', requestedId: 'foundation' });
    expect(svc.getActive().fallbackReason).toBeUndefined();
  });

  it('refuses an unknown skin and changes nothing', async () => {
    await writeSkin('alpha');
    const svc = service();
    await svc.initialize();
    const listener = vi.fn();
    svc.onChange(listener);
    expect(await svc.setActive('ghost', 'renderer')).toEqual({
      applied: false,
      reason: 'unknown-skin',
    });
    expect(listener).not.toHaveBeenCalled();
    await expect(fs.readFile(prefFile)).rejects.toThrow();
    expect(svc.getActive().activeId).toBe('foundation');
  });

  it.each([
    ['invalid', 'invalid', '{nope'],
    ['incompatible', 'incompatible', '{"schemaVersion":2}'],
  ] as const)('refuses an %s skin', async (_label, reason, body) => {
    await fs.mkdir(path.join(root, 'bad'));
    await fs.writeFile(path.join(root, 'bad', 'skin.json'), body);
    const svc = service();
    await svc.initialize();
    expect(await svc.setActive('bad', 'renderer')).toEqual({ applied: false, reason });
    expect(svc.getActive().activeId).toBe('foundation');
  });

  it('applies for the session and reports persisted false when the write fails', async () => {
    await writeSkin('alpha');
    const svc = service({ load: () => Promise.resolve(null), save: () => Promise.resolve(false) });
    await svc.initialize();
    expect(await svc.setActive('alpha', 'renderer')).toMatchObject({
      applied: true,
      persisted: false,
    });
    expect(svc.getActive().activeId).toBe('alpha');
  });

  it('keeps notifying other listeners when one throws', async () => {
    await writeSkin('alpha');
    const svc = service();
    await svc.initialize();
    const second = vi.fn();
    svc.onChange(() => {
      throw new Error('C:\\secret');
    });
    svc.onChange(second);
    await svc.setActive('alpha', 'renderer');
    expect(second).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(log.warn.mock.calls)).not.toContain('secret');
  });

  it('answers load-failed when the token store is full', async () => {
    await writeSkin('alpha');
    const svc = createSkinService({
      fs: nodeFs,
      pathApi: path,
      roots: [root],
      preference: realPreference(),
      tokens: createSkinTokenStore(undefined, 1),
      log,
    });
    await svc.initialize();
    const result = await svc.setActive('alpha', 'renderer');
    expect(result.applied && result.active).toMatchObject({
      activeId: 'foundation',
      fallbackReason: 'load-failed',
    });
  });
});

describe('menuEntries', () => {
  it('lists Foundation first and disables skins that are not ok', async () => {
    await writeSkin('alpha', 'Alpha');
    await fs.mkdir(path.join(root, 'junk'));
    await fs.writeFile(path.join(root, 'junk', 'skin.json'), '{nope');
    const svc = service();
    await svc.initialize();
    expect(svc.menuEntries()).toEqual([
      { id: 'foundation', name: 'Foundation', enabled: true },
      { id: 'alpha', name: 'Alpha', enabled: true },
      { id: 'junk', name: 'junk', enabled: false },
    ]);
  });
});

describe('readAsset (serve-time validation)', () => {
  const tokenFor = async (svc: SkinService, key: string): Promise<string> => {
    await svc.setActive('alpha', 'renderer');
    const url = svc.getActive().skin.assetUrls[key] as string;
    return url.slice('media://skin/'.length);
  };

  it('returns the validated bytes and the declared type', async () => {
    await writeSkin('alpha');
    const svc = service();
    await svc.initialize();
    const svg = await svc.readAsset(await tokenFor(svc, 'bg'));
    expect(svg?.type).toBe('svg');
    expect(new TextDecoder().decode(svg?.bytes)).toBe(SVG_OK);
    expect((await svc.readAsset(await tokenFor(svc, 'tex')))?.type).toBe('png');
  });

  it('refuses unknown tokens', async () => {
    await writeSkin('alpha');
    const svc = service();
    await svc.initialize();
    expect(await svc.readAsset('00000000-0000-4000-8000-000000000000')).toBeUndefined();
    expect(await svc.readAsset('../../skin.json')).toBeUndefined();
  });

  it('re-checks the file at serve time and refuses a file swapped for unsafe content', async () => {
    await writeSkin('alpha');
    const svc = service();
    await svc.initialize();
    const token = await tokenFor(svc, 'bg');
    await fs.writeFile(
      path.join(root, 'alpha', 'assets', 'bg.svg'),
      `<svg ${NS}><script>alert(1)</script></svg>`,
    );
    expect(await svc.readAsset(token)).toBeUndefined();
  });

  it('refuses a file that was deleted or grew past the cap after the scan', async () => {
    await writeSkin('alpha');
    const svc = service();
    await svc.initialize();
    const token = await tokenFor(svc, 'tex');
    await fs.writeFile(
      path.join(root, 'alpha', 'assets', 'tex.png'),
      new Uint8Array(2 * 1024 * 1024),
    );
    expect(await svc.readAsset(token)).toBeUndefined();
    await fs.rm(path.join(root, 'alpha', 'assets', 'tex.png'));
    expect(await svc.readAsset(token)).toBeUndefined();
  });

  it('never serves a skin that is not ok, and forgets tokens when cleared', async () => {
    await writeSkin('alpha');
    const svc = service();
    await svc.initialize();
    const token = await tokenFor(svc, 'bg');
    svc.clearTokens();
    expect(await svc.readAsset(token)).toBeUndefined();
    // A new window asks again and gets fresh, working tokens.
    const fresh = svc.getActive().skin.assetUrls['bg'] as string;
    expect(await svc.readAsset(fresh.slice('media://skin/'.length))).toBeDefined();
  });

  it('answers undefined instead of throwing when the file system fails', async () => {
    await writeSkin('alpha');
    const svc = createSkinService({
      fs: {
        ...nodeFs,
        lstat: (p) =>
          p.endsWith('bg.svg') && armed ? Promise.reject(new Error('x')) : fs.lstat(p),
      },
      pathApi: path,
      roots: [root],
      preference: realPreference(),
      tokens: createSkinTokenStore(),
      log,
    });
    let armed = false;
    await svc.initialize();
    const token = await tokenFor(svc, 'bg');
    armed = true;
    expect(await svc.readAsset(token)).toBeUndefined();
  });
});
