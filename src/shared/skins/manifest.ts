import { z } from 'zod';
import { assetPathSchema } from './asset-path';
import {
  ICON_IDS,
  REGION_IDS,
  assetKeySchema,
  colorRefSchema,
  hexColorSchema,
  safeTextSchema,
  skinIdSchema,
  styleKeySchema,
} from './ids';
import { SKIN_LIMITS } from './limits';

const px = (min: number, max: number) => z.number().int().min(min).max(max);
const unit = z.number().min(0).max(1);
const anchor9 = z.enum([
  'top-left',
  'top',
  'top-right',
  'left',
  'center',
  'right',
  'bottom-left',
  'bottom',
  'bottom-right',
]);
const blend = z.enum([
  'normal',
  'multiply',
  'screen',
  'overlay',
  'soft-light',
  'lighten',
  'color-dodge',
]);
const paint = z.union([hexColorSchema, colorRefSchema]);

export const ASSET_TYPES = ['svg', 'png', 'webp', 'woff2'] as const;
export const assetDeclSchema = z.strictObject({
  path: assetPathSchema,
  type: z.enum(ASSET_TYPES),
});

// ---- tokens
const colorTokens = z.strictObject({
  appBg: hexColorSchema,
  surface: hexColorSchema,
  surfaceRaised: hexColorSchema,
  surfaceInset: hexColorSchema,
  borderSubtle: hexColorSchema,
  borderControl: hexColorSchema,
  text: hexColorSchema,
  textMuted: hexColorSchema,
  textDisabled: hexColorSchema,
  accent: hexColorSchema,
  onAccent: hexColorSchema,
  focus: hexColorSchema,
  danger: hexColorSchema,
  warning: hexColorSchema,
  glow: hexColorSchema,
  displayBg: hexColorSchema,
  displayText: hexColorSchema,
  rowAlt: hexColorSchema,
  rowSelected: hexColorSchema,
  onRowSelected: hexColorSchema,
});
const fontStack = z.strictObject({
  families: z.array(z.string().regex(/^[A-Za-z0-9][A-Za-z0-9 -]{0,39}$/)).max(6),
  generic: z.enum(['serif', 'sans-serif', 'monospace', 'system-ui']),
  fontAsset: assetKeySchema.optional(),
});
const tokens = z.strictObject({
  color: colorTokens,
  space: z.strictObject({
    s1: px(0, 8),
    s2: px(0, 16),
    s3: px(0, 24),
    s4: px(0, 32),
    s5: px(0, 40),
    s6: px(0, 64),
  }),
  shape: z.strictObject({
    radius1: px(0, 24),
    radius2: px(0, 32),
    borderWidth: px(0, 6),
    focusRingWidth: px(2, 4),
    focusRingOffset: px(0, 6),
    controlSize: px(28, 56),
  }),
  font: z.strictObject({
    size1: px(9, 16),
    size2: px(10, 20),
    size3: px(11, 28),
    size4: px(14, 40),
    ui: fontStack,
    mono: fontStack,
    display: fontStack,
    displayTransform: z.enum(['none', 'uppercase', 'small-caps']),
    displayTracking: z.number().min(0).max(0.4),
  }),
  motion: z.strictObject({ durationFast: px(0, 400), durationSlow: px(0, 1200) }),
});

// ---- surfaces
const layer = z.strictObject({
  asset: assetKeySchema,
  size: z.enum(['cover', 'contain', 'tile', 'auto']),
  tile: z.strictObject({ width: px(8, 1024), height: px(8, 1024) }).optional(),
  position: anchor9,
  opacity: unit,
  blend,
});
const nineSlice = z.strictObject({
  asset: assetKeySchema,
  slice: z.strictObject({
    top: px(1, 256),
    right: px(1, 256),
    bottom: px(1, 256),
    left: px(1, 256),
  }),
  width: z.strictObject({ top: px(0, 48), right: px(0, 48), bottom: px(0, 48), left: px(0, 48) }),
  fill: z.boolean(),
});
const surface = z.strictObject({
  color: hexColorSchema.optional(),
  layers: z.array(layer).max(SKIN_LIMITS.layersPerSurface),
  frame: nineSlice.optional(),
  radius: px(0, 32).optional(),
  shadow: z.enum(['none', 'inset', 'raised', 'glow']),
});

// ---- controls
const buttonState = z.strictObject({
  face: assetKeySchema.optional(),
  brightness: z.number().min(0.4).max(1.8),
  offsetY: px(-3, 3),
  glow: unit,
});
const buttonStyle = z.strictObject({
  shape: z.enum(['circle', 'diamond', 'rect', 'rounded-rect', 'hexagon', 'arch']),
  width: px(20, 96),
  height: px(20, 96),
  face: assetKeySchema.optional(),
  iconScale: z.number().min(0.3).max(0.9),
  states: z.strictObject({
    normal: buttonState,
    hover: buttonState.optional(),
    pressed: buttonState.optional(),
    disabled: buttonState.optional(),
    checked: buttonState.optional(),
  }),
});
const thumb = z.strictObject({
  shape: z.enum(['circle', 'diamond', 'rect', 'bar']),
  width: px(8, 64),
  height: px(8, 64),
  asset: assetKeySchema.optional(),
});
const sliderStyle = z.strictObject({
  orientation: z.enum(['horizontal', 'vertical']),
  thickness: px(4, 48),
  trackAsset: assetKeySchema.optional(),
  fill: z.enum(['none', 'solid', 'segmented']),
  fillColor: colorRefSchema,
  segments: px(4, 40).optional(),
  thumb,
  ticks: z.boolean(),
});
const knobStyle = z.strictObject({
  size: px(32, 140),
  capAsset: assetKeySchema,
  indicator: z.enum(['none', 'line', 'dot']),
  indicatorColor: colorRefSchema,
  sweepStart: px(-180, 0),
  sweepEnd: px(0, 180),
  ticks: z.boolean(),
});
const switchStyle = z.strictObject({
  kind: z.enum(['lever', 'latch', 'led-button', 'rocker']),
  width: px(24, 96),
  height: px(20, 96),
  onAsset: assetKeySchema.optional(),
  offAsset: assetKeySchema.optional(),
  ledColor: colorRefSchema,
  label: z.enum(['above', 'below', 'inline']),
});
const displayStyle = z.strictObject({
  kind: z.enum(['text', 'seven-segment']),
  font: z.enum(['ui', 'mono', 'display']),
  fontSize: px(10, 32),
  color: colorRefSchema,
  background: styleKeySchema.optional(),
  glowRadius: px(0, 12),
  letterSpacing: z.number().min(0).max(0.3),
  uppercase: z.boolean(),
  scanlines: z.boolean(),
});
const controls = z.strictObject({
  buttons: z.record(styleKeySchema, buttonStyle),
  sliders: z.record(styleKeySchema, sliderStyle),
  knobs: z.record(styleKeySchema, knobStyle),
  switches: z.record(styleKeySchema, switchStyle),
  displays: z.record(styleKeySchema, displayStyle),
});

// ---- layout
const track = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('fr'), value: z.number().min(0.1).max(12) }),
  z.strictObject({ kind: z.literal('px'), value: px(0, 1600) }),
  z.strictObject({
    kind: z.literal('minmax'),
    min: px(0, 1600),
    maxFr: z.number().min(0.1).max(12),
  }),
  z.strictObject({ kind: z.literal('auto') }),
]);
const areaCell = z.union([z.enum(REGION_IDS), z.literal('.')]);
const layoutVariant = z.strictObject({
  minWidth: px(0, 4096),
  columns: z.array(track).min(1).max(SKIN_LIMITS.layoutTracks),
  rows: z.array(track).min(1).max(SKIN_LIMITS.layoutTracks),
  areas: z
    .array(z.array(areaCell).min(1).max(SKIN_LIMITS.layoutTracks))
    .min(1)
    .max(SKIN_LIMITS.layoutTracks),
  gap: px(0, 32),
  padding: px(0, 48),
});
const decor = z.strictObject({
  asset: assetKeySchema,
  target: z.union([z.literal('app'), z.enum(REGION_IDS)]),
  anchor: anchor9,
  offsetX: px(-400, 400),
  offsetY: px(-400, 400),
  width: px(1, 2000),
  height: px(1, 2000),
  opacity: unit,
  blend,
  layer: z.enum(['behind', 'above']),
  motion: z.enum(['none', 'drift', 'pulse', 'flicker']),
});
const layout = z.strictObject({
  variants: z.array(layoutVariant).min(1).max(SKIN_LIMITS.layoutVariants),
  decor: z.array(decor).max(SKIN_LIMITS.decorLayers),
});

// ---- component slots
const controlRef = z.strictObject({ kind: z.enum(['slider', 'knob']), style: styleKeySchema });
const regionFrame = z.strictObject({
  surface: styleKeySchema,
  inset: px(0, 48),
  heading: z.enum(['visible', 'visually-hidden']),
});
const components = z.strictObject({
  regions: z.partialRecord(z.enum(REGION_IDS), regionFrame),
  transport: z.strictObject({
    arrangement: z.enum(['row', 'cluster']),
    button: styleKeySchema,
    playButton: styleKeySchema,
    toggleButton: styleKeySchema,
    gap: px(0, 24),
  }),
  seek: z.strictObject({
    control: styleKeySchema,
    time: styleKeySchema,
    timePlacement: z.enum(['inline-end', 'above', 'split']),
  }),
  volume: z.strictObject({
    control: controlRef,
    muteButton: styleKeySchema.nullable(),
  }),
  trackInfo: z.strictObject({
    variant: z.enum(['stacked', 'marquee-line', 'lcd-two-line', 'plaque']),
    display: styleKeySchema,
    showAlbum: z.boolean(),
  }),
  artwork: z.strictObject({
    variant: z.enum(['plain', 'framed', 'bezel', 'arched', 'round']),
    frame: styleKeySchema.optional(),
    placeholder: assetKeySchema.optional(),
  }),
  equalizer: z.strictObject({
    arrangement: z.enum(['bands-then-preamp', 'preamp-first']),
    band: controlRef,
    preamp: controlRef,
    bypass: styleKeySchema,
    presets: z.enum(['select', 'cycle-button']),
    presetButton: styleKeySchema.optional(),
    showGainScale: z.boolean(),
    showFrequencyLabels: z.boolean(),
    showValues: z.boolean(),
  }),
  playlist: z.strictObject({
    rowVariant: z.enum(['compact', 'two-line']),
    rowHeight: px(18, 40),
    columns: z.strictObject({ index: z.boolean(), duration: z.boolean(), thumbnail: z.boolean() }),
    header: z.boolean(),
    toolbarButton: styleKeySchema,
    scrollbarWidth: px(6, 16),
  }),
  status: z.strictObject({ display: styleKeySchema }),
});

// ---- visualization presentation
const gradientStop = z.strictObject({ at: unit, color: paint });
const visualization = z.strictObject({
  defaultMode: z.enum(['spectrum', 'waveform']),
  allowToggle: z.boolean(),
  spectrum: z.strictObject({
    style: z.enum(['bars', 'segments', 'line', 'dots', 'needles']),
    bars: px(16, 64),
    barGap: px(0, 8),
    segmentHeight: px(2, 12),
    peakHold: z.boolean(),
    mirror: z.boolean(),
    stops: z.array(gradientStop).min(2).max(5),
  }),
  waveform: z.strictObject({
    style: z.enum(['line', 'filled', 'dots']),
    lineWidth: px(1, 4),
    color: paint,
    glowRadius: px(0, 12),
  }),
  needles: z
    .strictObject({
      dial: assetKeySchema,
      needleColor: paint,
      sweepStart: px(-90, 0),
      sweepEnd: px(0, 90),
      lengthRatio: z.number().min(0.3).max(1),
    })
    .optional(),
  surface: styleKeySchema,
  grid: z.boolean(),
  scanlines: z.boolean(),
  frameRate: z.union([z.literal(30), z.literal(60)]),
});

// ---- window decoration
const windowDef = z.strictObject({
  decoration: z.literal('custom'),
  minSize: z.strictObject({ width: px(560, 1000), height: px(360, 700) }),
  preferredSize: z.strictObject({ width: px(560, 1920), height: px(360, 1200) }),
  titleBar: z.strictObject({
    height: px(24, 56),
    surface: styleKeySchema,
    align: z.enum(['start', 'center']),
    controlsSide: z.enum(['start', 'end']),
    buttonStyle: styleKeySchema,
    menu: z.enum(['inline', 'collapsed']),
    titleVisible: z.boolean(),
  }),
  frame: styleKeySchema.optional(),
  resizeGrip: z.boolean(),
});

export const skinManifestSchema = z.strictObject({
  schemaVersion: z.literal(1),
  id: skinIdSchema,
  name: safeTextSchema(48),
  version: z.string().regex(/^\d{1,4}\.\d{1,4}\.\d{1,4}$/),
  author: safeTextSchema(80),
  description: safeTextSchema(280),
  license: safeTextSchema(64),
  preview: assetKeySchema.optional(),
  assets: z.record(assetKeySchema, assetDeclSchema),
  icons: z.partialRecord(z.enum(ICON_IDS), assetKeySchema),
  tokens,
  surfaces: z.record(styleKeySchema, surface),
  controls,
  layout,
  components,
  visualization,
  window: windowDef,
});
export type SkinManifest = z.infer<typeof skinManifestSchema>;
export type SkinSurface = z.infer<typeof surface>;
export type SkinLayoutVariant = z.infer<typeof layoutVariant>;
export type SkinFontStack = z.infer<typeof fontStack>;

/** Loose pre-check. Returns the numeric `schemaVersion` of an object, else null. Never throws. */
export function readSchemaVersion(json: unknown): number | null {
  if (typeof json !== 'object' || json === null || Array.isArray(json)) {
    return null;
  }
  const value: unknown = Object.getOwnPropertyDescriptor(json, 'schemaVersion')?.value;
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
