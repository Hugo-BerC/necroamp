import {
  MANDATORY_REGIONS,
  SKIN_LIMITS,
  type SkinIssue,
  type SkinIssueCode,
  type SkinManifest,
} from '@shared/skins';

/**
 * Cross-reference checks the scanner needs before it touches a file (asset keys resolve, asset
 * types match their extension, style references resolve, layout shape). Pure, never throws.
 *
 * Contract note: the contract defines `validateSkinSemantics` in `@shared/skins/semantic.ts`
 * (including layout rectangles, fit and contrast checks). It is not exported yet, so this
 * main-local subset covers what confinement and registration depend on. Swap it for the shared
 * function when that lands.
 */
export interface SemanticOptions {
  readonly allowReservedId?: boolean;
}

const RESERVED_ID = 'foundation';

export function validateSkinSemantics(
  manifest: SkinManifest,
  options: SemanticOptions = {},
): readonly SkinIssue[] {
  const issues: SkinIssue[] = [];
  const add = (code: SkinIssueCode, path: string): void => {
    issues.push({ code, path });
  };
  const { assets, controls, surfaces, components, layout, window } = {
    assets: manifest.assets,
    controls: manifest.controls,
    surfaces: manifest.surfaces,
    components: manifest.components,
    layout: manifest.layout,
    window: manifest.window,
  };

  if (manifest.id === RESERVED_ID && options.allowReservedId !== true) add('RESERVED_ID', 'id');
  if (!Object.hasOwn(surfaces, 'app')) add('SURFACE_APP_MISSING', 'surfaces.app');

  // ---- assets
  const keys = Object.keys(assets);
  if (keys.length > SKIN_LIMITS.assetCount) add('ASSET_LIMIT', 'assets');
  const seenPaths = new Set<string>();
  for (const key of keys) {
    const decl = assets[key];
    if (decl === undefined) continue;
    if (!decl.path.endsWith(`.${decl.type}`)) add('ASSET_TYPE_MISMATCH', `assets.${key}`);
    if (seenPaths.has(decl.path)) add('ASSET_PATH_DUPLICATE', `assets.${key}`);
    seenPaths.add(decl.path);
  }
  const need = (key: string | undefined, path: string): void => {
    if (key !== undefined && !Object.hasOwn(assets, key)) add('ASSET_MISSING_REF', path);
  };
  const fontKeys = new Set<string>();
  for (const [name, stack] of Object.entries(manifest.tokens.font)) {
    if (typeof stack === 'object' && 'fontAsset' in stack && stack.fontAsset !== undefined) {
      need(stack.fontAsset, `tokens.font.${name}.fontAsset`);
      fontKeys.add(stack.fontAsset);
      if (assets[stack.fontAsset]?.type !== 'woff2') add('ASSET_KIND', `tokens.font.${name}`);
    }
  }
  for (const key of keys) {
    if (assets[key]?.type === 'woff2' && !fontKeys.has(key)) add('ASSET_KIND', `assets.${key}`);
  }
  need(manifest.preview, 'preview');
  for (const [icon, key] of Object.entries(manifest.icons)) need(key, `icons.${icon}`);
  for (const [name, surface] of Object.entries(surfaces)) {
    for (const [i, l] of surface.layers.entries()) {
      need(l.asset, `surfaces.${name}.layers.${i}`);
    }
    need(surface.frame?.asset, `surfaces.${name}.frame`);
  }
  for (const [name, b] of Object.entries(controls.buttons)) {
    need(b.face, `controls.buttons.${name}`);
    for (const [state, s] of Object.entries(b.states)) {
      need(s?.face, `controls.buttons.${name}.states.${state}`);
    }
  }
  for (const [name, s] of Object.entries(controls.sliders)) {
    need(s.trackAsset, `controls.sliders.${name}.trackAsset`);
    need(s.thumb.asset, `controls.sliders.${name}.thumb`);
  }
  for (const [name, k] of Object.entries(controls.knobs)) {
    need(k.capAsset, `controls.knobs.${name}.capAsset`);
    if (k.sweepStart >= k.sweepEnd) add('KNOB_SWEEP', `controls.knobs.${name}`);
  }
  for (const [name, s] of Object.entries(controls.switches)) {
    need(s.onAsset, `controls.switches.${name}.onAsset`);
    need(s.offAsset, `controls.switches.${name}.offAsset`);
  }
  for (const [i, d] of layout.decor.entries()) need(d.asset, `layout.decor.${i}`);
  need(manifest.visualization.needles?.dial, 'visualization.needles.dial');
  need(components.artwork.placeholder, 'components.artwork.placeholder');

  // ---- style references
  const style = (
    kind: 'buttons' | 'sliders' | 'knobs' | 'switches' | 'displays' | 'surfaces',
    key: string | null | undefined,
    path: string,
  ): void => {
    if (key === null || key === undefined) return;
    const dictionary = kind === 'surfaces' ? surfaces : controls[kind];
    if (!Object.hasOwn(dictionary, key)) add('STYLE_MISSING_REF', path);
  };
  const t = components.transport;
  style('buttons', t.button, 'components.transport.button');
  style('buttons', t.playButton, 'components.transport.playButton');
  style('buttons', t.toggleButton, 'components.transport.toggleButton');
  style('buttons', components.volume.muteButton, 'components.volume.muteButton');
  style('buttons', components.equalizer.presetButton, 'components.equalizer.presetButton');
  style('buttons', components.playlist.toolbarButton, 'components.playlist.toolbarButton');
  style('buttons', window.titleBar.buttonStyle, 'window.titleBar.buttonStyle');
  style('sliders', components.seek.control, 'components.seek.control');
  style('displays', components.seek.time, 'components.seek.time');
  style('displays', components.trackInfo.display, 'components.trackInfo.display');
  style('displays', components.status.display, 'components.status.display');
  style('switches', components.equalizer.bypass, 'components.equalizer.bypass');
  const control = (ref: { kind: 'slider' | 'knob'; style: string }, path: string): void => {
    style(ref.kind === 'slider' ? 'sliders' : 'knobs', ref.style, path);
  };
  control(components.volume.control, 'components.volume.control');
  control(components.equalizer.band, 'components.equalizer.band');
  control(components.equalizer.preamp, 'components.equalizer.preamp');
  for (const [region, frame] of Object.entries(components.regions)) {
    style('surfaces', frame.surface, `components.regions.${region}`);
  }
  style('surfaces', components.artwork.frame, 'components.artwork.frame');
  for (const [name, d] of Object.entries(controls.displays)) {
    style('surfaces', d.background, `controls.displays.${name}.background`);
  }
  style('surfaces', manifest.visualization.surface, 'visualization.surface');
  style('surfaces', window.titleBar.surface, 'window.titleBar.surface');
  style('surfaces', window.frame, 'window.frame');
  const count = (n: number, max: number, path: string): void => {
    if (n > max) add('STYLE_LIMIT', path);
  };
  count(Object.keys(surfaces).length, SKIN_LIMITS.surfaces, 'surfaces');
  count(Object.keys(controls.buttons).length, SKIN_LIMITS.styles.buttons, 'controls.buttons');
  count(Object.keys(controls.sliders).length, SKIN_LIMITS.styles.sliders, 'controls.sliders');
  count(Object.keys(controls.knobs).length, SKIN_LIMITS.styles.knobs, 'controls.knobs');
  count(Object.keys(controls.switches).length, SKIN_LIMITS.styles.switches, 'controls.switches');
  count(Object.keys(controls.displays).length, SKIN_LIMITS.styles.displays, 'controls.displays');

  // ---- orientation
  const band = components.equalizer.band;
  if (band.kind === 'slider' && controls.sliders[band.style]?.orientation === 'horizontal') {
    add('EQ_BAND_NOT_VERTICAL', 'components.equalizer.band');
  }
  if (controls.sliders[components.seek.control]?.orientation === 'vertical') {
    add('SEEK_NOT_HORIZONTAL', 'components.seek.control');
  }
  const needles = manifest.visualization.needles;
  if (needles !== undefined && needles.sweepStart >= needles.sweepEnd) {
    add('KNOB_SWEEP', 'visualization.needles');
  }
  if (manifest.visualization.spectrum.style === 'needles' && needles === undefined) {
    add('NEEDLES_MISSING', 'visualization.needles');
  }

  // ---- layout
  const minWidths = new Set<number>();
  let base = 0;
  for (const [i, variant] of layout.variants.entries()) {
    const path = `layout.variants.${i}`;
    if (variant.minWidth === 0) base += 1;
    if (minWidths.has(variant.minWidth)) add('LAYOUT_DUPLICATE_MIN_WIDTH', path);
    minWidths.add(variant.minWidth);
    const shaped =
      variant.areas.length === variant.rows.length &&
      variant.areas.every((row) => row.length === variant.columns.length);
    if (!shaped) add('LAYOUT_AREAS_SHAPE', path);
    const placed = new Set<string>(variant.areas.flat());
    for (const region of MANDATORY_REGIONS) {
      if (!placed.has(region)) add('LAYOUT_MANDATORY_MISSING', `${path}.${region}`);
    }
    for (const region of placed) {
      if (region === '.') continue;
      if (!Object.hasOwn(components.regions, region))
        add('REGION_FRAME_MISSING', `${path}.${region}`);
    }
  }
  if (base !== 1) add('LAYOUT_NO_BASE_VARIANT', 'layout.variants');
  return issues;
}
