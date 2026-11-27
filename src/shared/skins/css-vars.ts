import { assetKeySchema } from './ids';
import type { SkinFontStack, SkinLayoutVariant, SkinManifest, SkinSurface } from './manifest';
import { skinAssetUrlSchema } from './resolved';

export type CssVariableName = `--na-${string}`;
export type CssVariables = Readonly<Record<CssVariableName, string>>;
export type AssetUrls = Readonly<Record<string, string>>;

function kebab(key: string): string {
  return key.replace(/[A-Z0-9]/g, (c) => `-${c.toLowerCase()}`);
}

/** Returns a `url("media://skin/<uuid>")` value only for a declared key with a valid URL. */
function assetUrlValue(key: string, urls: AssetUrls): string | null {
  if (!assetKeySchema.safeParse(key).success || !Object.hasOwn(urls, key)) {
    return null;
  }
  const url = urls[key];
  const parsed = skinAssetUrlSchema.safeParse(url);
  return parsed.success ? `url("${parsed.data}")` : null;
}

const ANCHOR_CSS: Readonly<Record<string, string>> = Object.freeze({
  'top-left': 'left top',
  top: 'center top',
  'top-right': 'right top',
  left: 'left center',
  center: 'center center',
  right: 'right center',
  'bottom-left': 'left bottom',
  bottom: 'center bottom',
  'bottom-right': 'right bottom',
});

const SHADOW_CSS: Readonly<Record<SkinSurface['shadow'], string>> = Object.freeze({
  none: 'none',
  inset: 'inset 0 1px 3px rgba(0, 0, 0, 0.6)',
  raised: '0 2px 4px rgba(0, 0, 0, 0.5)',
  glow: '0 0 12px var(--na-color-glow)',
});

function fontFamilyValue(skinId: string, stack: SkinFontStack): string {
  const names: string[] = [];
  if (stack.fontAsset !== undefined) {
    names.push(`"na-skin-${skinId}-${stack.fontAsset}"`);
  }
  for (const family of stack.families) {
    names.push(`"${family}"`);
  }
  names.push(stack.generic);
  return names.join(', ');
}

function surfaceVars(
  key: string,
  surface: SkinSurface,
  urls: AssetUrls,
  out: Record<string, string>,
): void {
  const prefix = `--na-surface-${key}`;
  const images: string[] = [];
  const sizes: string[] = [];
  const positions: string[] = [];
  const repeats: string[] = [];
  const blends: string[] = [];
  const opacities: string[] = [];
  for (const layer of surface.layers) {
    const image = assetUrlValue(layer.asset, urls);
    if (image === null) {
      continue;
    }
    images.push(image);
    const tiled = layer.size === 'tile';
    sizes.push(
      tiled && layer.tile
        ? `${layer.tile.width}px ${layer.tile.height}px`
        : layer.size === 'tile'
          ? 'auto'
          : layer.size,
    );
    positions.push(ANCHOR_CSS[layer.position] ?? 'center center');
    repeats.push(tiled ? 'repeat' : 'no-repeat');
    blends.push(layer.blend);
    opacities.push(String(layer.opacity));
  }
  out[`${prefix}-color`] = surface.color ?? 'transparent';
  out[`${prefix}-image`] = images.length > 0 ? images.join(', ') : 'none';
  out[`${prefix}-size`] = sizes.length > 0 ? sizes.join(', ') : 'auto';
  out[`${prefix}-position`] = positions.length > 0 ? positions.join(', ') : '0 0';
  out[`${prefix}-repeat`] = repeats.length > 0 ? repeats.join(', ') : 'no-repeat';
  out[`${prefix}-blend`] = blends.length > 0 ? blends.join(', ') : 'normal';
  out[`${prefix}-opacity`] = opacities.length > 0 ? opacities.join(', ') : '1';
  out[`${prefix}-radius`] = `${surface.radius ?? 0}px`;
  out[`${prefix}-shadow`] = SHADOW_CSS[surface.shadow];
  const frame = surface.frame;
  const frameImage = frame ? assetUrlValue(frame.asset, urls) : null;
  if (frame && frameImage !== null) {
    const { slice, width } = frame;
    out[`${prefix}-frame-source`] = frameImage;
    out[`${prefix}-frame-slice`] =
      `${slice.top} ${slice.right} ${slice.bottom} ${slice.left}${frame.fill ? ' fill' : ''}`;
    out[`${prefix}-frame-width`] =
      `${width.top}px ${width.right}px ${width.bottom}px ${width.left}px`;
    out[`${prefix}-frame-repeat`] = 'stretch';
  }
}

/**
 * Maps a validated manifest to CSS custom properties. Values come only from validated numbers,
 * hex colors, enum members, quoted validated family names and `media://skin/<uuid>` URLs. A URL
 * that fails `skinAssetUrlSchema` is omitted, so no other `url()` can be produced.
 */
export function skinToCssVariables(manifest: SkinManifest, assetUrls: AssetUrls): CssVariables {
  const out: Record<string, string> = {};
  const { tokens, surfaces } = manifest;

  for (const [key, value] of Object.entries(tokens.color)) {
    out[`--na-color-${kebab(key)}`] = value;
  }
  for (const [key, value] of Object.entries(tokens.space)) {
    out[`--na-space-${key.slice(1)}`] = `${value}px`;
  }
  const { shape, font, motion } = tokens;
  out['--na-radius-1'] = `${shape.radius1}px`;
  out['--na-radius-2'] = `${shape.radius2}px`;
  out['--na-border-width'] = `${shape.borderWidth}px`;
  out['--na-focus-ring-width'] = `${shape.focusRingWidth}px`;
  out['--na-focus-ring-offset'] = `${shape.focusRingOffset}px`;
  out['--na-control-size'] = `${shape.controlSize}px`;
  out['--na-font-size-1'] = `${font.size1}px`;
  out['--na-font-size-2'] = `${font.size2}px`;
  out['--na-font-size-3'] = `${font.size3}px`;
  out['--na-font-size-4'] = `${font.size4}px`;
  out['--na-font-family-ui'] = fontFamilyValue(manifest.id, font.ui);
  out['--na-font-family-mono'] = fontFamilyValue(manifest.id, font.mono);
  out['--na-font-family-display'] = fontFamilyValue(manifest.id, font.display);
  out['--na-display-transform'] = font.displayTransform === 'uppercase' ? 'uppercase' : 'none';
  out['--na-display-caps'] = font.displayTransform === 'small-caps' ? 'small-caps' : 'normal';
  out['--na-display-tracking'] = `${font.displayTracking}em`;
  out['--na-duration-fast'] = `${motion.durationFast}ms`;
  out['--na-duration-slow'] = `${motion.durationSlow}ms`;

  for (const key of Object.keys(manifest.assets)) {
    const value = assetUrlValue(key, assetUrls);
    if (value !== null) {
      out[`--na-asset-${key}`] = value;
    }
  }
  for (const [key, surface] of Object.entries(surfaces)) {
    surfaceVars(key, surface, assetUrls, out);
  }
  return out as CssVariables;
}

function trackToCss(track: SkinLayoutVariant['columns'][number]): string {
  switch (track.kind) {
    case 'fr':
      return `${track.value}fr`;
    case 'px':
      return `${track.value}px`;
    case 'minmax':
      return `minmax(${track.min}px, ${track.maxFr}fr)`;
    case 'auto':
      return 'auto';
  }
}

/** Grid properties for one layout variant, built only from validated numbers and region ids. */
export function layoutVariantToGrid(variant: SkinLayoutVariant): {
  readonly templateColumns: string;
  readonly templateRows: string;
  readonly templateAreas: string;
  readonly gap: string;
  readonly padding: string;
} {
  return {
    templateColumns: variant.columns.map(trackToCss).join(' '),
    templateRows: variant.rows.map(trackToCss).join(' '),
    templateAreas: variant.areas.map((row) => `"${row.join(' ')}"`).join(' '),
    gap: `${variant.gap}px`,
    padding: `${variant.padding}px`,
  };
}
