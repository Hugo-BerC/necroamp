import { describe, expect, it } from 'vitest';
import { makeManifest } from '../skins/test-manifest';
import {
  activeSkinSchema,
  skinsListResponseSchema,
  skinsSetActiveRequestSchema,
  skinsSetActiveResponseSchema,
} from './skins';
import { windowGetStateResponseSchema, windowActionRequestSchema } from './window';

const active = {
  activeId: 'test-skin',
  requestedId: null,
  skin: { manifest: makeManifest(), assetUrls: {} },
};

describe('skins IPC schemas', () => {
  it('accepts only a strict { skinId } request', () => {
    expect(skinsSetActiveRequestSchema.safeParse([{ skinId: 'morgul-revenant' }]).success).toBe(
      true,
    );
    for (const bad of [
      [],
      [{ skinId: '../x' }],
      [{ skinId: 'a', path: 'x' }],
      [{ skinId: 'C:\\x' }],
      ['a'],
    ]) {
      expect(skinsSetActiveRequestSchema.safeParse(bad).success).toBe(false);
    }
  });

  it('validates active skin and responses', () => {
    expect(activeSkinSchema.safeParse(active).success).toBe(true);
    expect(activeSkinSchema.safeParse({ ...active, extra: 1 }).success).toBe(false);
    expect(activeSkinSchema.safeParse({ ...active, fallbackReason: 'nope' }).success).toBe(false);
    expect(
      skinsSetActiveResponseSchema.safeParse({
        ok: true,
        data: { applied: false, reason: 'invalid' },
      }).success,
    ).toBe(true);
    expect(
      skinsSetActiveResponseSchema.safeParse({
        ok: true,
        data: { applied: true, active, persisted: true },
      }).success,
    ).toBe(true);
  });

  it('validates the skin list', () => {
    const skins = [
      {
        id: 'foundation',
        name: 'Foundation',
        version: '1.0.0',
        author: 'NecroAmp',
        description: 'Default.',
        origin: 'embedded',
        status: 'ok',
        errorCodes: [],
      },
      {
        id: 'broken',
        name: 'broken',
        version: '0.0.0',
        author: 'Unknown',
        description: 'This skin could not be loaded.',
        origin: 'builtin',
        status: 'invalid',
        errorCodes: ['SCHEMA'],
      },
    ];
    expect(
      skinsListResponseSchema.safeParse({ ok: true, data: { skins, activeId: 'foundation' } })
        .success,
    ).toBe(true);
    const leaky = [{ ...skins[1], path: 'C:\\x' }];
    expect(
      skinsListResponseSchema.safeParse({ ok: true, data: { skins: leaky, activeId: 'a' } })
        .success,
    ).toBe(false);
  });
});

describe('window IPC schemas', () => {
  it('takes no arguments and returns strict state', () => {
    expect(windowActionRequestSchema.safeParse([]).success).toBe(true);
    expect(windowActionRequestSchema.safeParse([1]).success).toBe(false);
    const state = { maximized: false, fullScreen: false, focused: true, platform: 'win32' };
    expect(windowGetStateResponseSchema.safeParse({ ok: true, data: state }).success).toBe(true);
    expect(
      windowGetStateResponseSchema.safeParse({ ok: true, data: { ...state, platform: 'freebsd' } })
        .success,
    ).toBe(false);
  });
});
