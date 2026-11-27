import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { readSchemaVersion, skinManifestSchema } from './manifest';
import { makeManifest } from './test-manifest';

describe('skinManifestSchema', () => {
  it('accepts a valid manifest', () => {
    expect(skinManifestSchema.safeParse(makeManifest()).success).toBe(true);
  });

  it('rejects unknown fields at the root and nested', () => {
    expect(skinManifestSchema.safeParse({ ...makeManifest(), script: 'x' }).success).toBe(false);
    const m = makeManifest();
    const nested = { ...m, tokens: { ...m.tokens, space: { ...m.tokens.space, s7: 1 } } };
    expect(skinManifestSchema.safeParse(nested).success).toBe(false);
  });

  it('requires schemaVersion 1', () => {
    expect(skinManifestSchema.safeParse({ ...makeManifest(), schemaVersion: 2 }).success).toBe(
      false,
    );
    const rest: Record<string, unknown> = { ...makeManifest() };
    delete rest.schemaVersion;
    expect(skinManifestSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects unsafe asset paths, bad ids and markup in text', () => {
    const m = makeManifest();
    const badPath = { ...m, assets: { bg: { path: '../x.svg', type: 'svg' } } };
    expect(skinManifestSchema.safeParse(badPath).success).toBe(false);
    expect(skinManifestSchema.safeParse({ ...m, id: 'Bad_Id' }).success).toBe(false);
    expect(skinManifestSchema.safeParse({ ...m, name: '<b>x</b>' }).success).toBe(false);
  });

  it('enforces size limits', () => {
    const m = makeManifest();
    const layer = m.surfaces.app?.layers[0];
    const many = { ...m.surfaces.app, layers: Array.from({ length: 7 }, () => layer) };
    expect(skinManifestSchema.safeParse({ ...m, surfaces: { app: many } }).success).toBe(false);
    const decor = Array.from({ length: 25 }, () => ({
      asset: 'bg',
      target: 'app',
      anchor: 'center',
      offsetX: 0,
      offsetY: 0,
      width: 1,
      height: 1,
      opacity: 1,
      blend: 'normal',
      layer: 'behind',
      motion: 'none',
    }));
    const tooMuchDecor = { ...m, layout: { ...m.layout, decor } };
    expect(skinManifestSchema.safeParse(tooMuchDecor).success).toBe(false);
  });

  it('never carries a __proto__ record key through', () => {
    const text = JSON.stringify(makeManifest()).replace('"bg":{', '"__proto__":{');
    const res = skinManifestSchema.safeParse(JSON.parse(text));
    if (res.success) {
      expect(Object.hasOwn(res.data.assets, '__proto__')).toBe(false);
    }
  });
});

describe('readSchemaVersion', () => {
  it('reads numeric versions only', () => {
    expect(readSchemaVersion({ schemaVersion: 3 })).toBe(3);
    expect(readSchemaVersion({ schemaVersion: '1' })).toBeNull();
    expect(readSchemaVersion([])).toBeNull();
    expect(readSchemaVersion(null)).toBeNull();
    expect(readSchemaVersion({ schemaVersion: Number.NaN })).toBeNull();
  });
});

describe('manifest validation (property)', () => {
  it('never throws on arbitrary input', () => {
    fc.assert(
      fc.property(fc.jsonValue(), fc.anything(), (a, b) => {
        for (const v of [a, b]) {
          expect(() => skinManifestSchema.safeParse(v)).not.toThrow();
          expect(() => readSchemaVersion(v)).not.toThrow();
        }
      }),
      { numRuns: 300 },
    );
  });

  it('never accepts a manifest whose asset path was replaced by an arbitrary unsafe string', () => {
    fc.assert(
      fc.property(fc.string(), (path) => {
        const m = makeManifest();
        const res = skinManifestSchema.safeParse({
          ...m,
          assets: { bg: { path, type: 'svg' } },
        });
        if (res.success) {
          expect(path.startsWith('assets/')).toBe(true);
          expect(path).not.toMatch(/\.\.|\\|:|%|^\//);
        }
      }),
      { numRuns: 500 },
    );
  });
});
