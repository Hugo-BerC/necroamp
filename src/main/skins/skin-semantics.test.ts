import { describe, expect, it } from 'vitest';
import type { SkinManifest } from '@shared/skins';
import { FOUNDATION_MANIFEST } from './foundation-manifest';
import { validateSkinSemantics } from './skin-semantics';

const base = (): SkinManifest =>
  structuredClone({
    ...FOUNDATION_MANIFEST,
    id: 'sample',
    assets: { bg: { path: 'assets/bg.svg', type: 'svg' as const } },
  });
const codes = (m: SkinManifest) => validateSkinSemantics(m).map((i) => i.code);

describe('validateSkinSemantics', () => {
  it('accepts a coherent manifest', () => {
    expect(codes(base())).toEqual([]);
  });

  it('rejects the reserved id', () => {
    expect(codes({ ...base(), id: 'foundation' })).toContain('RESERVED_ID');
  });

  it('requires the app surface', () => {
    const m = base();
    delete (m.surfaces as Record<string, unknown>)['app'];
    expect(codes(m)).toContain('SURFACE_APP_MISSING');
  });

  it('checks asset type against the extension and duplicate paths', () => {
    const m = base();
    m.assets = {
      a: { path: 'assets/a.png', type: 'svg' },
      b: { path: 'assets/b.svg', type: 'svg' },
      c: { path: 'assets/b.svg', type: 'svg' },
    };
    expect(codes(m)).toEqual(
      expect.arrayContaining(['ASSET_TYPE_MISMATCH', 'ASSET_PATH_DUPLICATE']),
    );
  });

  it('limits the asset count', () => {
    const m = base();
    m.assets = Object.fromEntries(
      Array.from({ length: 97 }, (_, i) => [
        `a${String.fromCharCode(97 + (i % 26))}${i}`,
        { path: `assets/a${i}.svg`, type: 'svg' as const },
      ]),
    );
    expect(codes(m)).toContain('ASSET_LIMIT');
  });

  it('reports a reference to an undeclared asset from each place that can hold one', () => {
    const m = base();
    m.preview = 'nope';
    m.icons = { play: 'nope' };
    m.surfaces['app'] = {
      layers: [{ asset: 'nope', size: 'cover', position: 'center', opacity: 1, blend: 'normal' }],
      shadow: 'none',
    };
    m.layout.decor = [
      {
        asset: 'nope',
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
      },
    ];
    const found = validateSkinSemantics(m).filter((i) => i.code === 'ASSET_MISSING_REF');
    expect(found.map((i) => i.path)).toEqual(
      expect.arrayContaining(['preview', 'icons.play', 'surfaces.app.layers.0', 'layout.decor.0']),
    );
  });

  it('keeps woff2 for font stacks only', () => {
    const m = base();
    m.assets['font'] = { path: 'assets/f.woff2', type: 'woff2' };
    expect(codes(m)).toContain('ASSET_KIND');
    m.tokens.font.display = { ...m.tokens.font.display, fontAsset: 'font' };
    expect(codes(m)).not.toContain('ASSET_KIND');
    m.tokens.font.ui = { ...m.tokens.font.ui, fontAsset: 'bg' };
    expect(codes(m)).toContain('ASSET_KIND');
  });

  it('resolves style references in the right dictionary', () => {
    const m = base();
    m.components.transport.button = 'ghost';
    m.components.seek.control = 'ghost';
    m.components.equalizer.bypass = 'ghost';
    m.components.trackInfo.display = 'ghost';
    m.components.regions['playlist'] = { surface: 'ghost', inset: 0, heading: 'visible' };
    expect(
      validateSkinSemantics(m)
        .filter((i) => i.code === 'STYLE_MISSING_REF')
        .map((i) => i.path),
    ).toEqual(
      expect.arrayContaining([
        'components.transport.button',
        'components.seek.control',
        'components.equalizer.bypass',
        'components.trackInfo.display',
        'components.regions.playlist',
      ]),
    );
  });

  it('flags a knob control that points at a slider name', () => {
    const m = base();
    m.components.volume.control = { kind: 'knob', style: 'volume' };
    expect(codes(m)).toContain('STYLE_MISSING_REF');
  });

  it('enforces dictionary size limits', () => {
    const m = base();
    const button = m.controls.buttons['transport'];
    if (button === undefined) throw new Error('fixture');
    m.controls.buttons = Object.fromEntries(
      Array.from({ length: 9 }, (_, i) => [`b${String.fromCharCode(97 + i)}`, button]),
    );
    expect(codes(m)).toContain('STYLE_LIMIT');
  });

  it('checks control orientation and sweeps', () => {
    const m = base();
    const band = m.controls.sliders['band'];
    if (band === undefined) throw new Error('fixture');
    m.controls.sliders['band'] = { ...band, orientation: 'horizontal' };
    m.controls.sliders['seek'] = { ...band, orientation: 'vertical' };
    m.controls.knobs['k'] = {
      size: 40,
      capAsset: 'bg',
      indicator: 'dot',
      indicatorColor: 'accent',
      sweepStart: 0,
      sweepEnd: 0,
      ticks: false,
    };
    m.visualization.spectrum.style = 'needles';
    expect(codes(m)).toEqual(
      expect.arrayContaining([
        'EQ_BAND_NOT_VERTICAL',
        'SEEK_NOT_HORIZONTAL',
        'KNOB_SWEEP',
        'NEEDLES_MISSING',
      ]),
    );
    m.visualization.needles = {
      dial: 'bg',
      needleColor: 'accent',
      sweepStart: 10,
      sweepEnd: -10,
      lengthRatio: 0.5,
    };
    expect(
      validateSkinSemantics(m)
        .filter((i) => i.path === 'visualization.needles')
        .map((i) => i.code),
    ).toContain('KNOB_SWEEP');
  });

  it('checks layout variants', () => {
    const m = base();
    const variant = m.layout.variants[0];
    if (variant === undefined) throw new Error('fixture');
    m.layout.variants = [
      { ...variant, minWidth: 10, areas: [['transport']] },
      { ...variant, minWidth: 10 },
    ];
    expect(codes(m)).toEqual(
      expect.arrayContaining([
        'LAYOUT_NO_BASE_VARIANT',
        'LAYOUT_DUPLICATE_MIN_WIDTH',
        'LAYOUT_AREAS_SHAPE',
        'LAYOUT_MANDATORY_MISSING',
      ]),
    );
  });

  it('requires a frame for every placed region', () => {
    const m = base();
    delete (m.components.regions as Record<string, unknown>)['visualization'];
    expect(codes(m)).toContain('REGION_FRAME_MISSING');
  });
});
