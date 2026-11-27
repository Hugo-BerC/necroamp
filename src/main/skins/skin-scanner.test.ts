import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SkinManifest } from '@shared/skins';
import type { SkinFs, SkinStats } from './asset-files';
import { FOUNDATION_MANIFEST } from './foundation-manifest';
import { scanSkinRoot, type ScannerDeps } from './skin-scanner';

const NS = 'xmlns="http://www.w3.org/2000/svg"';
const SVG_OK = `<svg ${NS} viewBox="0 0 8 8"><rect width="8" height="8" fill="#123456"/></svg>`;

function png(width: number, height: number, size = 40): Uint8Array {
  const bytes = new Uint8Array(size);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  bytes.set([0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52], 8);
  new DataView(bytes.buffer).setUint32(16, width);
  new DataView(bytes.buffer).setUint32(20, height);
  return bytes;
}

function manifest(id: string): SkinManifest {
  const m = structuredClone(FOUNDATION_MANIFEST);
  m.id = id;
  m.name = `Skin ${id}`;
  m.assets = {
    bg: { path: 'assets/bg.svg', type: 'svg' },
    tex: { path: 'assets/tex/panel.png', type: 'png' },
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
const deps: ScannerDeps = { fs: nodeFs, pathApi: path, log };

let root: string;
let outside: string;

async function put(file: string, data: string | Uint8Array): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, data);
}

/** Writes a complete valid skin. Returns its directory. */
async function writeSkin(id: string, edit?: (m: SkinManifest) => void): Promise<string> {
  const dir = path.join(root, id);
  const m = manifest(id);
  edit?.(m);
  await put(path.join(dir, 'skin.json'), JSON.stringify(m));
  await put(path.join(dir, 'assets', 'bg.svg'), SVG_OK);
  await put(path.join(dir, 'assets', 'tex', 'panel.png'), png(10, 10));
  return dir;
}

const scanOne = async (id: string) => (await scanSkinRoot(deps, root)).find((r) => r.id === id);

beforeEach(async () => {
  const base = await fs.mkdtemp(path.join(os.tmpdir(), 'necroamp-skins-'));
  root = path.join(base, 'skins');
  outside = path.join(base, 'outside');
  await fs.mkdir(root, { recursive: true });
  await fs.mkdir(outside, { recursive: true });
  vi.clearAllMocks();
});

afterEach(async () => {
  await fs.rm(path.dirname(root), { recursive: true, force: true });
});

describe('scanSkinRoot: valid skins', () => {
  it('registers a valid skin with its declared assets and no error codes', async () => {
    await writeSkin('good-skin');
    const record = await scanOne('good-skin');
    expect(record?.status).toBe('ok');
    expect(record?.errorCodes).toEqual([]);
    expect(record?.manifest?.name).toBe('Skin good-skin');
    expect([...(record?.assets.keys() ?? [])]).toEqual(['bg', 'tex']);
  });

  it('returns skins in sorted directory order', async () => {
    await writeSkin('b-skin');
    await writeSkin('a-skin');
    expect((await scanSkinRoot(deps, root)).map((r) => r.id)).toEqual(['a-skin', 'b-skin']);
  });

  it('returns nothing for a missing root and never throws', async () => {
    expect(await scanSkinRoot(deps, path.join(root, 'absent'))).toEqual([]);
    expect(log.info).toHaveBeenCalledWith('skins.root_unavailable', { code: 'ROOT' });
  });

  it('ignores loose files, reserved and badly named directories', async () => {
    await writeSkin('foundation');
    await put(path.join(root, 'notes.txt'), 'x');
    await fs.mkdir(path.join(root, 'Bad_Name'));
    await fs.mkdir(path.join(root, '.hidden'));
    await fs.mkdir(path.join(root, '..evil'));
    const records = await scanSkinRoot(deps, root);
    expect(records).toEqual([]);
  });

  it('examines at most 32 directories', async () => {
    for (let i = 0; i < 35; i += 1) {
      await fs.mkdir(path.join(root, `s${String(i).padStart(2, '0')}`));
    }
    expect(await scanSkinRoot(deps, root)).toHaveLength(32);
  });
});

describe('scanSkinRoot: manifest problems', () => {
  it('rejects a missing manifest', async () => {
    await fs.mkdir(path.join(root, 'empty-skin'));
    expect((await scanOne('empty-skin'))?.errorCodes).toEqual(['FILE_MISSING']);
  });

  it('rejects a manifest that is not JSON', async () => {
    await put(path.join(root, 'junk', 'skin.json'), '{nope');
    expect(await scanOne('junk')).toMatchObject({ status: 'invalid', errorCodes: ['JSON_PARSE'] });
  });

  it('rejects invalid UTF-8 as a parse failure', async () => {
    await put(path.join(root, 'bytes', 'skin.json'), Uint8Array.from([0x7b, 0xff, 0xfe]));
    expect((await scanOne('bytes'))?.errorCodes).toEqual(['JSON_PARSE']);
  });

  it('rejects an oversized manifest without reading it', async () => {
    await put(path.join(root, 'huge', 'skin.json'), ' '.repeat(128 * 1024 + 1));
    expect((await scanOne('huge'))?.errorCodes).toEqual(['MANIFEST_TOO_LARGE']);
  });

  it('classifies an unknown schemaVersion as incompatible', async () => {
    const m = { ...manifest('future'), schemaVersion: 2 };
    await put(path.join(root, 'future', 'skin.json'), JSON.stringify(m));
    expect(await scanOne('future')).toMatchObject({
      status: 'incompatible',
      errorCodes: ['SCHEMA_VERSION'],
      manifest: null,
    });
  });

  it.each([
    ['an unknown field', { extra: true }],
    ['a missing field', { name: undefined }],
    ['a script-like name', { name: '<script>x</script>' }],
    ['a bad version', { version: '1.0' }],
  ])('rejects a manifest with %s', async (_label, patch) => {
    const m = { ...manifest('bad-schema'), ...patch };
    await put(path.join(root, 'bad-schema', 'skin.json'), JSON.stringify(m));
    expect(await scanOne('bad-schema')).toMatchObject({
      status: 'invalid',
      errorCodes: ['SCHEMA'],
    });
  });

  it('rejects an id that differs from the directory name', async () => {
    await put(path.join(root, 'dir-name', 'skin.json'), JSON.stringify(manifest('other-id')));
    expect((await scanOne('dir-name'))?.errorCodes).toContain('ID_MISMATCH');
  });

  it('rejects the reserved id even in a differently named directory', async () => {
    await put(path.join(root, 'imposter', 'skin.json'), JSON.stringify(manifest('foundation')));
    expect((await scanOne('imposter'))?.errorCodes).toEqual(
      expect.arrayContaining(['RESERVED_ID', 'ID_MISMATCH']),
    );
  });

  it('reports a semantic problem such as an undeclared asset reference', async () => {
    await writeSkin('dangling', (m) => {
      m.icons = { play: 'ghost' };
    });
    expect(await scanOne('dangling')).toMatchObject({
      status: 'invalid',
      errorCodes: ['ASSET_MISSING_REF'],
    });
  });
});

describe('scanSkinRoot: traversal and path forms in the manifest are rejected by the schema', () => {
  it.each([
    '../outside/secret.png',
    'assets/../../outside/secret.png',
    '/etc/passwd',
    'C:/Windows/win.ini',
    'C:\\Windows\\win.ini',
    '\\\\server\\share\\x.png',
    '//server/share/x.png',
    'assets\\bg.svg',
    'assets/%2e%2e/x.png',
    'assets/bg.svg.exe',
    'assets/con.png',
    'assets/Bg.svg',
    'skin.json',
    '',
  ])('asset path %j', async (assetPath) => {
    await writeSkin('trav', (m) => {
      m.assets['bg'] = { path: assetPath, type: 'svg' };
    });
    expect(await scanOne('trav')).toMatchObject({ status: 'invalid', errorCodes: ['SCHEMA'] });
  });
});

describe('scanSkinRoot: asset files', () => {
  it('rejects a declared file that does not exist', async () => {
    const dir = await writeSkin('gone');
    await fs.rm(path.join(dir, 'assets', 'bg.svg'));
    expect((await scanOne('gone'))?.errorCodes).toEqual(['FILE_MISSING']);
  });

  it('rejects a directory declared as a file', async () => {
    const dir = await writeSkin('dir-as-file');
    await fs.rm(path.join(dir, 'assets', 'bg.svg'));
    await fs.mkdir(path.join(dir, 'assets', 'bg.svg'));
    expect((await scanOne('dir-as-file'))?.errorCodes).toEqual(['FILE_MISSING']);
  });

  it('rejects bytes whose magic does not match the declared type', async () => {
    const dir = await writeSkin('liar');
    await put(path.join(dir, 'assets', 'tex', 'panel.png'), 'GIF89a not a png at all.............');
    expect((await scanOne('liar'))?.errorCodes).toEqual(['MAGIC_MISMATCH']);
  });

  it('rejects an unparseable image header', async () => {
    const dir = await writeSkin('trunc');
    const bytes = png(10, 10);
    bytes[12] = 0;
    await put(path.join(dir, 'assets', 'tex', 'panel.png'), bytes);
    expect((await scanOne('trunc'))?.errorCodes).toEqual(['IMAGE_UNPARSEABLE']);
  });

  it('rejects images over the dimension limits and a preview over 640 pixels', async () => {
    const dir = await writeSkin('big-image');
    await put(path.join(dir, 'assets', 'tex', 'panel.png'), png(700, 10));
    expect((await scanOne('big-image'))?.errorCodes).toEqual(['IMAGE_TOO_LARGE']);
    await put(path.join(dir, 'assets', 'tex', 'panel.png'), png(4097, 10));
    expect((await scanOne('big-image'))?.errorCodes).toEqual(['IMAGE_TOO_LARGE']);
  });

  it('allows a larger image when it is not the preview', async () => {
    const dir = await writeSkin('wide', (m) => {
      delete m.preview;
    });
    await put(path.join(dir, 'assets', 'tex', 'panel.png'), png(2048, 2048));
    expect((await scanOne('wide'))?.status).toBe('ok');
  });

  it('rejects a raster file over 1 MiB', async () => {
    const dir = await writeSkin('fat');
    await put(path.join(dir, 'assets', 'tex', 'panel.png'), png(10, 10, 1024 * 1024 + 1));
    expect((await scanOne('fat'))?.errorCodes).toEqual(['FILE_TOO_LARGE']);
  });

  it('rejects when the total asset size is over 8 MiB', async () => {
    const dir = await writeSkin('total', (m) => {
      for (let i = 0; i < 9; i += 1) {
        m.assets[`big${i}`] = { path: `assets/big${i}.png`, type: 'png' };
      }
    });
    for (let i = 0; i < 9; i += 1) {
      await put(path.join(dir, 'assets', `big${i}.png`), png(10, 10, 1000 * 1024));
    }
    expect((await scanOne('total'))?.errorCodes).toEqual(['TOTAL_TOO_LARGE']);
  });

  it.each([
    ['a script element', '<script>alert(1)</script>'],
    ['foreignObject', '<foreignObject><div/></foreignObject>'],
    ['an event handler', '<rect width="1" height="1" onload="x()"/>'],
    ['an external reference', '<rect width="1" height="1" fill="url(https://evil.test/x)"/>'],
    ['an external href', '<use href="https://evil.test/x.svg#a"/>'],
  ])('rejects an SVG with %s', async (_label, inner) => {
    const dir = await writeSkin('bad-svg');
    await put(path.join(dir, 'assets', 'bg.svg'), `<svg ${NS}>${inner}</svg>`);
    expect(await scanOne('bad-svg')).toMatchObject({
      status: 'invalid',
      errorCodes: ['SVG_UNSAFE'],
    });
  });

  it('caps the reported error codes at eight and removes duplicates', async () => {
    const dir = await writeSkin('many', (m) => {
      for (let i = 0; i < 12; i += 1)
        m.assets[`x${String.fromCharCode(97 + i)}`] = { path: `assets/m${i}.png`, type: 'png' };
      m.icons = { play: 'g1', pause: 'g2', stop: 'g3', next: 'g4', previous: 'g5' };
      m.components.transport.button = 'ghost';
      m.components.seek.control = 'ghost';
      m.components.equalizer.bypass = 'ghost';
      m.components.status.display = 'ghost';
      m.layout.variants = [];
    });
    void dir;
    const record = await scanOne('many');
    expect(record?.status).toBe('invalid');
    expect(record?.errorCodes.length).toBeLessThanOrEqual(8);
    expect(new Set(record?.errorCodes).size).toBe(record?.errorCodes.length);
  });
});

describe('scanSkinRoot: symlinks and escape', () => {
  const link = async (target: string, linkPath: string): Promise<boolean> => {
    try {
      await fs.symlink(target, linkPath, 'junction');
      return true;
    } catch {
      return false;
    }
  };

  it('rejects a skin directory that is a link to another location', async () => {
    const real = await writeSkin('real-skin');
    await fs.rename(real, path.join(outside, 'real-skin'));
    if (!(await link(path.join(outside, 'real-skin'), path.join(root, 'linked')))) return;
    expect(await scanOne('linked')).toMatchObject({
      status: 'invalid',
      errorCodes: ['FILE_SYMLINK'],
    });
  });

  it('rejects an assets sub-directory that links outside the skin root', async () => {
    const dir = await writeSkin('junction');
    await put(path.join(outside, 'panel.png'), png(10, 10));
    await fs.rm(path.join(dir, 'assets', 'tex'), { recursive: true });
    if (!(await link(outside, path.join(dir, 'assets', 'tex')))) return;
    expect((await scanOne('junction'))?.errorCodes).toEqual(['FILE_SYMLINK']);
  });

  it('rejects an asset file that is a symlink', async () => {
    const dir = await writeSkin('file-link');
    await put(path.join(outside, 'secret.svg'), SVG_OK);
    await fs.rm(path.join(dir, 'assets', 'bg.svg'));
    try {
      await fs.symlink(
        path.join(outside, 'secret.svg'),
        path.join(dir, 'assets', 'bg.svg'),
        'file',
      );
    } catch {
      return; // Creating file symlinks needs a privilege on Windows.
    }
    expect((await scanOne('file-link'))?.errorCodes).toEqual(['FILE_SYMLINK']);
  });

  it('rejects a file whose real path leaves the skin root even when lstat looks regular', async () => {
    await writeSkin('sneaky');
    const escaping: SkinFs = {
      ...nodeFs,
      realpath: async (p) => (p.endsWith('bg.svg') ? path.join(outside, 'bg.svg') : fs.realpath(p)),
    };
    const records = await scanSkinRoot({ ...deps, fs: escaping }, root);
    expect(records[0]?.errorCodes).toEqual(['FILE_ESCAPE']);
  });

  it('treats a lone `..` or empty segment as an escape without touching the disk', async () => {
    const lstat = vi.fn<SkinFs['lstat']>();
    await writeSkin('probe', (m) => {
      m.assets['bg'] = { path: 'assets/bg.svg', type: 'svg' };
    });
    const guarded: SkinFs = { ...nodeFs, lstat };
    lstat.mockImplementation((p) => nodeFs.lstat(p));
    const { readConfinedFile } = await import('./asset-files');
    for (const bad of ['assets/../x.svg', 'assets//x.svg', 'assets/./x.svg', 'a\\b.svg']) {
      const result = await readConfinedFile(guarded, path, root, root, bad, 1000);
      expect(result).toEqual({ ok: false, code: 'FILE_ESCAPE' });
    }
    expect(lstat).not.toHaveBeenCalled();
  });

  it('reports an unreadable skin as invalid and keeps scanning the others', async () => {
    await writeSkin('first');
    await writeSkin('second');
    const flaky: SkinFs = {
      ...nodeFs,
      lstat: async (p: string): Promise<SkinStats> => {
        if (p.endsWith(`${path.sep}first`)) throw new Error('C:\\secret\\boom');
        return fs.lstat(p);
      },
    };
    const records = await scanSkinRoot({ ...deps, fs: flaky }, root);
    expect(records.map((r) => [r.id, r.status])).toEqual([
      ['first', 'invalid'],
      ['second', 'ok'],
    ]);
    expect(JSON.stringify(log.warn.mock.calls)).not.toContain('secret');
  });

  it('survives an exception thrown while scanning one skin', async () => {
    await writeSkin('boom');
    const exploding: SkinFs = {
      ...nodeFs,
      readFile: () => {
        throw new Error('C:\\secret');
      },
    };
    const records = await scanSkinRoot({ ...deps, fs: exploding }, root);
    expect(records[0]?.status).toBe('invalid');
  });
});
