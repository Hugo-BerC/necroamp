import { describe, expect, it } from 'vitest';
import { skinManifestSchema } from '@shared/skins';
import { FOUNDATION_MANIFEST, FOUNDATION_SKIN_ID } from './foundation-manifest';
import { validateSkinSemantics } from './skin-semantics';

describe('Foundation skin', () => {
  it('is the reserved embedded skin with no assets', () => {
    expect(FOUNDATION_MANIFEST.id).toBe(FOUNDATION_SKIN_ID);
    expect(FOUNDATION_MANIFEST.assets).toEqual({});
    expect(FOUNDATION_MANIFEST.icons).toEqual({});
  });

  it('round-trips through the strict schema', () => {
    expect(skinManifestSchema.safeParse(FOUNDATION_MANIFEST).success).toBe(true);
  });

  it('passes the semantic checks only when the reserved id is allowed', () => {
    expect(validateSkinSemantics(FOUNDATION_MANIFEST, { allowReservedId: true })).toEqual([]);
    expect(validateSkinSemantics(FOUNDATION_MANIFEST).map((i) => i.code)).toEqual(['RESERVED_ID']);
  });

  it('keeps the Foundation minimum window size of 800 by 600', () => {
    expect(FOUNDATION_MANIFEST.window.minSize).toEqual({ width: 800, height: 600 });
  });
});
