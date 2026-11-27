import { describe, expect, it, vi } from 'vitest';
import { createSkinPreference, type SkinPreferenceFs } from './skin-preference';

const log = () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() });

function memoryFs(initial?: string) {
  const files = new Map<string, string>();
  if (initial !== undefined) files.set('pref.json', initial);
  const fs: SkinPreferenceFs = {
    readFile: (p) => {
      const data = files.get(p);
      return data === undefined
        ? Promise.reject(Object.assign(new Error('C:\\secret\\path'), { code: 'ENOENT' }))
        : Promise.resolve(data);
    },
    writeFile: (p, data) => {
      files.set(p, data);
      return Promise.resolve();
    },
    rename: (from, to) => {
      const data = files.get(from) as string;
      files.delete(from);
      files.set(to, data);
      return Promise.resolve();
    },
    rm: (p) => {
      files.delete(p);
      return Promise.resolve();
    },
  };
  return { fs, files };
}

describe('skin preference', () => {
  it('returns null without logging when the file does not exist', async () => {
    const l = log();
    const { fs } = memoryFs();
    expect(await createSkinPreference({ fs, filePath: 'pref.json', log: l }).load()).toBeNull();
    expect(l.warn).not.toHaveBeenCalled();
  });

  it('round-trips a skin id through an atomic write', async () => {
    const { fs, files } = memoryFs();
    const pref = createSkinPreference({ fs, filePath: 'pref.json', log: log() });
    expect(await pref.save('morgul-revenant')).toBe(true);
    expect(JSON.parse(files.get('pref.json') as string)).toEqual({
      schemaVersion: 1,
      skinId: 'morgul-revenant',
    });
    expect(files.has('pref.json.tmp')).toBe(false);
    expect(await pref.load()).toBe('morgul-revenant');
  });

  it.each([
    ['not json', '{nope'],
    ['unknown version', '{"schemaVersion":2,"skinId":"x"}'],
    ['extra field', '{"schemaVersion":1,"skinId":"x","path":"C:/x"}'],
    ['bad id', '{"schemaVersion":1,"skinId":"../x"}'],
    ['wrong type', '{"schemaVersion":1,"skinId":7}'],
    ['array', '[]'],
  ])('treats %s as no preference and warns by code only', async (_name, body) => {
    const l = log();
    const { fs } = memoryFs(body);
    expect(await createSkinPreference({ fs, filePath: 'pref.json', log: l }).load()).toBeNull();
    expect(l.warn).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(l.warn.mock.calls)).not.toContain('C:');
  });

  it('logs a non-ENOENT read error by code and returns null', async () => {
    const l = log();
    const { fs } = memoryFs();
    const failing: SkinPreferenceFs = {
      ...fs,
      readFile: () => Promise.reject(Object.assign(new Error('C:\\x'), { code: 'EACCES' })),
    };
    expect(await createSkinPreference({ fs: failing, filePath: 'p', log: l }).load()).toBeNull();
    expect(l.warn).toHaveBeenCalledWith('skins.preference_read_failed', { code: 'EACCES' });
  });

  it('reports a failed write, cleans the temp file and never leaks the error text', async () => {
    const l = log();
    const { fs } = memoryFs();
    const rm = vi.fn(() => Promise.reject(new Error('already gone')));
    const failing: SkinPreferenceFs = {
      ...fs,
      writeFile: () => Promise.reject(new Error('C:\\Users\\secret\\x')),
      rm,
    };
    const pref = createSkinPreference({ fs: failing, filePath: 'p', log: l });
    expect(await pref.save('x')).toBe(false);
    expect(rm).toHaveBeenCalled();
    expect(l.error).toHaveBeenCalledWith('skins.preference_write_failed', { code: 'UNKNOWN' });
    expect(JSON.stringify(l.error.mock.calls)).not.toContain('secret');
  });

  it('serializes concurrent saves so the last call wins', async () => {
    const { fs } = memoryFs();
    const pref = createSkinPreference({ fs, filePath: 'pref.json', log: log() });
    await Promise.all([pref.save('one'), pref.save('two'), pref.save('three')]);
    expect(await pref.load()).toBe('three');
  });
});
