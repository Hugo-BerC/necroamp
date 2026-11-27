# Skin Engine: implementation contract (schemaVersion 1)

Canonical copy for `.agents/tasks/skin-engine/contract.md` (the architect's write scope excludes `.agents/**`; the orchestrator copies this file there verbatim). Authoritative for implementers. Decisions: ADR 0007 to 0010. Behavior and tests: Skin Engine Spec (`.kiro/specs/skin-engine/`, source in `docs/requirements/skin-engine/` and `docs/architecture/skin-engine/`). Where this file and an ADR differ, the ADR wins and the architect must be told. Names, field names, enums and limits below are binding. Helper wording may be adapted when exported types stay identical.

Conventions follow the repo: Zod 4 `z.strictObject`, `schemaVersion`, IPC request schemas are tuples of arguments, responses use `ipcResultSchema`, channels are constants in `src/shared/ipc/channels.ts`, English identifiers, no `any`, named exports.

## 1. File ownership and sequencing

| Path | Lands first (T0) | Maintained by afterwards | Reviewed by |
|---|---|---|---|
| `src/shared/skins/**` (ids, limits, asset-path, manifest, semantic, svg-safety, contrast, css-vars, resolved, `foundation-skin.ts`) | orchestrator step, from this file | frontend-engineer | necro-architect, security-reviewer (paths, SVG, limits), art-director (format) |
| `src/shared/ipc/{channels,skins,window,menu,necroamp-api,index}.ts` | orchestrator step | desktop-engineer | necro-architect, security-reviewer |
| `eslint.config.mjs` import zones (section 10) | orchestrator step | orchestrator | necro-architect |
| `src/main/skins/**`, `src/main/ipc/skins-handlers.ts`, `src/main/ipc/window-handlers.ts`, `src/main/ipc/install-ipc.ts`, `src/main/window/**`, `src/main/lifecycle/app-menu.ts`, `src/main/security/csp.ts`, `src/main/protocol/media-*.ts`, `src/main/index.ts`, `src/main/constants.ts`, `src/preload/**` | desktop-engineer | desktop-engineer | security-reviewer |
| `src/renderer/app/**` (incl. new `app/skin/`, `app/chrome/`), `src/renderer/features/**` (incl. `features/skins/` picker), `src/renderer/stores/**`, `src/renderer/components/**` (graphical primitives), `src/renderer/main.tsx`, `src/renderer/index.html` | frontend-engineer | frontend-engineer | qa-engineer (a11y), necro-architect |
| `src/renderer/audio/**`, `src/shared/audio/**` | not expected to change. audio-engineer only on a defect | audio-engineer | necro-architect |
| `skins/morgul-revenant/**`, `skins/analog-1984/**`, `docs/assets.md`, `docs/design/morgul-revenant.md`, `docs/design/analog-1984.md`, `docs/design/skin-authoring-guide.md` | art-director | art-director | security-reviewer (assets), qa-engineer (screenshots) |
| `*.property.test.ts`, `*.integration.test.ts`, `tests/e2e/**`, `tests/fixtures/**`, screenshots under `docs/testing/` | qa-engineer | qa-engineer | n/a |
| `docs/security/skin-engine-review.md` | security-reviewer | security-reviewer | n/a |
| `electron-builder.yml` (`extraResources` for `skins/`) | deferred item D2 (release-engineer) | n/a | n/a |
| ADRs 0007 to 0010, this contract, Spec sources | necro-architect | necro-architect | n/a |

Sequencing: T0 shared contracts first (one writer), then main and preload (desktop-engineer) and renderer runtime and primitives (frontend-engineer) and skin art (art-director) in parallel, since all three build against T0 only. No two agents edit one file at the same time. No new runtime dependency is allowed; existing `zod`, `react`, `zustand` suffice.

## 2. Shared module layout (`src/shared/skins/`, new subdirectory, ADR 0007)

```
ids.ts             REGION_IDS, MANDATORY_REGIONS, ICON_IDS, key and color schemas, safeTextSchema
limits.ts          SKIN_LIMITS
asset-path.ts      isSafeAssetPath(), assetPathSchema (pure, never throws)
manifest.ts        skinManifestSchema and sub schemas, SkinManifest, readSchemaVersion()
semantic.ts        validateSkinSemantics(manifest), SKIN_ISSUE_CODES, SkinIssue
contrast.ts        contrastRatio(); moved from renderer/app/theme/contrast.ts (renderer file re-exports it)
svg-safety.ts      validateSvg(bytes: Uint8Array): SvgVerdict, SVG_ALLOWED_ELEMENTS, SVG_ALLOWED_ATTRIBUTES
css-vars.ts        skinToCssVariables() and per-style helpers (pure)
resolved.ts        resolvedSkinSchema, skinAssetUrlSchema, ResolvedSkin
foundation-skin.ts FOUNDATION_SKIN: SkinManifest (embedded, asset-free), FOUNDATION_SKIN_ID = 'foundation'
index.ts           public named exports
```

`src/shared/skins` imports only `zod` and its own files. Nothing from Electron, DOM, Node, `@shared/audio` or `@shared/ipc`. `@shared/ipc/skins.ts` imports from `@shared/skins` (one direction).

## 3. Identifiers and limits

```ts
// ids.ts
export const REGION_IDS = [
  'track-info', 'artwork', 'transport', 'seek', 'volume',
  'visualization', 'equalizer', 'playlist', 'status', 'github',
] as const;
export type RegionId = (typeof REGION_IDS)[number];
export const MANDATORY_REGIONS = ['transport', 'seek', 'track-info', 'volume', 'playlist'] as const;
```

Region model change (contract change note required, section 14): the Foundation regions `player` and `skin-selector` go away. `player` splits into `track-info`, `artwork`, `transport`, `seek`, `volume`; skin selection moves to the View menu and the Skin picker dialog. `src/renderer/components/region-frame/region-ids.ts` re-exports `REGION_IDS` from `@shared/skins`. `github` remains as the Foundation placeholder; bundled skins may omit it.

```ts
export const ICON_IDS = [
  'play', 'pause', 'stop', 'previous', 'next', 'shuffle', 'repeat', 'repeat-one',
  'volume', 'mute', 'open', 'clear', 'minimize', 'maximize', 'restore', 'close',
] as const;
export type IconId = (typeof ICON_IDS)[number];

const KEY_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
export const skinIdSchema = z.string().max(40).regex(KEY_RE);
export const assetKeySchema = z.string().max(40).regex(KEY_RE);
export const styleKeySchema = assetKeySchema;                  // keys of surfaces and control styles
export const COLOR_REFS = ['accent', 'glow', 'text', 'textMuted', 'displayText', 'warning', 'danger'] as const;
export const colorRefSchema = z.enum(COLOR_REFS);              // resolved to var(--na-color-*) by css-vars
export const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/);
export const safeTextSchema = (max: number) =>
  z.string().min(1).max(max).regex(/^[^\u0000-\u001f\u007f<>]+$/);   // plain text, rendered as React text only
```

```ts
// limits.ts
export const SKIN_LIMITS = Object.freeze({
  manifestBytes: 128 * 1024,
  assetCount: 96,
  totalAssetBytes: 8 * 1024 * 1024,
  svgBytes: 256 * 1024,
  rasterBytes: 1024 * 1024,
  fontBytes: 256 * 1024,
  rasterMaxDimension: 4096,
  previewMaxDimension: 640,
  svgMaxElements: 5000,
  svgMaxDepth: 32,
  svgMaxFilterPrimitives: 40,
  surfaces: 16,
  layersPerSurface: 6,
  decorLayers: 24,
  styles: Object.freeze({ buttons: 8, sliders: 8, knobs: 4, switches: 4, displays: 4 }),
  layoutVariants: 4,
  layoutTracks: 12,
  skinsScanned: 32,
  registeredSkins: 8,
  errorCodesPerSkin: 8,
});
```

## 4. Asset declarations and path rules

```ts
// asset-path.ts  (pure, never throws)
const SEGMENT = '[a-z0-9][a-z0-9_-]{0,47}';
const PATH_RE = new RegExp(`^assets/(?:${SEGMENT}/){0,3}${SEGMENT}\\.(svg|png|webp|woff2)$`);
const RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/;   // Windows device names, checked on each segment stem
export function isSafeAssetPath(path: unknown): path is string;
export const assetPathSchema = z.string().max(128).refine(isSafeAssetPath);

// manifest.ts
export const ASSET_TYPES = ['svg', 'png', 'webp', 'woff2'] as const;
export const assetDeclSchema = z.strictObject({
  path: assetPathSchema,
  type: z.enum(ASSET_TYPES),          // must equal the path extension (semantic check)
});
```

`isSafeAssetPath` is true only if: string, at most 128 chars, matches `PATH_RE` (so lower case, forward slashes, relative, starts with `assets/`, no dots inside segments except the one extension dot), no segment stem matches `RESERVED`. Consequently rejected: `..`, `.`, absolute POSIX, drive letters, UNC (`\\`), backslashes, `%`-encoding, `:`, NUL, trailing dots or spaces, upper case, any other extension.

Scanner rules (main, I/O): `lstat` every path segment from the skin root to the file (no symlink, no junction, regular file); `realpath` inside the realpath of the skin root; size cap by type (`svgBytes`, `rasterBytes`, `fontBytes`) and `totalAssetBytes`; magic bytes (PNG `89 50 4E 47 0D 0A 1A 0A`; WebP `RIFF....WEBP`; WOFF2 `wOF2`; SVG through `validateSvg`); raster width and height parsed from PNG IHDR or WebP VP8/VP8L/VP8X and at most `rasterMaxDimension` (unparseable is invalid); the `preview` asset at most `previewMaxDimension`. Every referenced `assetKey` must be declared; an unreferenced declared asset is allowed.

## 5. Manifest schema (`manifest.ts`)

```ts
const px = (min: number, max: number) => z.number().int().min(min).max(max);
const unit = z.number().min(0).max(1);
const anchor9 = z.enum(['top-left','top','top-right','left','center','right','bottom-left','bottom','bottom-right']);
const blend = z.enum(['normal','multiply','screen','overlay','soft-light','lighten','color-dodge']);
const paint = z.union([hexColorSchema, colorRefSchema]);

// ---- tokens (section 7 maps them to CSS custom properties)
const colorTokens = z.strictObject({
  appBg: hexColorSchema, surface: hexColorSchema, surfaceRaised: hexColorSchema, surfaceInset: hexColorSchema,
  borderSubtle: hexColorSchema, borderControl: hexColorSchema,
  text: hexColorSchema, textMuted: hexColorSchema, textDisabled: hexColorSchema,
  accent: hexColorSchema, onAccent: hexColorSchema, focus: hexColorSchema,
  danger: hexColorSchema, warning: hexColorSchema,
  glow: hexColorSchema,
  displayBg: hexColorSchema, displayText: hexColorSchema,
  rowAlt: hexColorSchema, rowSelected: hexColorSchema, onRowSelected: hexColorSchema,
});
const fontStack = z.strictObject({
  families: z.array(z.string().regex(/^[A-Za-z0-9][A-Za-z0-9 -]{0,39}$/)).max(6),
  generic: z.enum(['serif', 'sans-serif', 'monospace', 'system-ui']),
  fontAsset: assetKeySchema.optional(),     // woff2 asset; FontFace family name 'na-skin-<skinId>-<key>'
});
const tokens = z.strictObject({
  color: colorTokens,
  space: z.strictObject({ s1: px(0,8), s2: px(0,16), s3: px(0,24), s4: px(0,32), s5: px(0,40), s6: px(0,64) }),
  shape: z.strictObject({
    radius1: px(0,24), radius2: px(0,32), borderWidth: px(0,6),
    focusRingWidth: px(2,4), focusRingOffset: px(0,6), controlSize: px(28,56),
  }),
  font: z.strictObject({
    size1: px(9,16), size2: px(10,20), size3: px(11,28), size4: px(14,40),
    ui: fontStack, mono: fontStack, display: fontStack,
    displayTransform: z.enum(['none', 'uppercase', 'small-caps']),
    displayTracking: z.number().min(0).max(0.4),    // em
  }),
  motion: z.strictObject({ durationFast: px(0,400), durationSlow: px(0,1200) }),
});

// ---- surfaces (backgrounds, textures, frames)
const layer = z.strictObject({
  asset: assetKeySchema,
  size: z.enum(['cover', 'contain', 'tile', 'auto']),
  tile: z.strictObject({ width: px(8,1024), height: px(8,1024) }).optional(),   // required with 'tile' (semantic)
  position: anchor9,
  opacity: unit,
  blend,
});
const nineSlice = z.strictObject({
  asset: assetKeySchema,
  slice: z.strictObject({ top: px(1,256), right: px(1,256), bottom: px(1,256), left: px(1,256) }),
  width: z.strictObject({ top: px(0,48), right: px(0,48), bottom: px(0,48), left: px(0,48) }),
  fill: z.boolean(),
});
const surface = z.strictObject({
  color: hexColorSchema.optional(),
  layers: z.array(layer).max(SKIN_LIMITS.layersPerSurface),
  frame: nineSlice.optional(),               // CSS border-image
  radius: px(0,32).optional(),
  shadow: z.enum(['none', 'inset', 'raised', 'glow']),   // trusted box-shadow presets built from tokens
});

// ---- controls (graphical control definitions)
const buttonState = z.strictObject({
  face: assetKeySchema.optional(),           // replaces the base face in this state
  brightness: z.number().min(0.4).max(1.8),
  offsetY: px(-3,3),
  glow: unit,
});
const buttonStyle = z.strictObject({
  shape: z.enum(['circle', 'diamond', 'rect', 'rounded-rect', 'hexagon', 'arch']),   // trusted clip-path shapes
  width: px(20,96), height: px(20,96),
  face: assetKeySchema.optional(),           // else surfaceRaised token
  iconScale: z.number().min(0.3).max(0.9),
  states: z.strictObject({                   // no 'focus': focus comes from tokens only and cannot be removed
    normal: buttonState,
    hover: buttonState.optional(), pressed: buttonState.optional(),
    disabled: buttonState.optional(), checked: buttonState.optional(),
  }),
});
const thumb = z.strictObject({
  shape: z.enum(['circle', 'diamond', 'rect', 'bar']),
  width: px(8,64), height: px(8,64),
  asset: assetKeySchema.optional(),
});
const sliderStyle = z.strictObject({
  orientation: z.enum(['horizontal', 'vertical']),
  thickness: px(4,48),
  trackAsset: assetKeySchema.optional(),
  fill: z.enum(['none', 'solid', 'segmented']),
  fillColor: colorRefSchema,
  segments: px(4,40).optional(),             // required with 'segmented' (semantic)
  thumb,
  ticks: z.boolean(),
});
const knobStyle = z.strictObject({
  size: px(32,140),
  capAsset: assetKeySchema,                  // rotating cap art, drawn pointing straight up
  indicator: z.enum(['none', 'line', 'dot']),
  indicatorColor: colorRefSchema,
  sweepStart: px(-180,0), sweepEnd: px(0,180),
  ticks: z.boolean(),
});
const switchStyle = z.strictObject({
  kind: z.enum(['lever', 'latch', 'led-button', 'rocker']),
  width: px(24,96), height: px(20,96),
  onAsset: assetKeySchema.optional(), offAsset: assetKeySchema.optional(),
  ledColor: colorRefSchema,
  label: z.enum(['above', 'below', 'inline']),
});
const displayStyle = z.strictObject({
  kind: z.enum(['text', 'seven-segment']),   // seven-segment: trusted glyphs, digits, ':' and '-' only; other text falls back to 'text'
  font: z.enum(['ui', 'mono', 'display']),
  fontSize: px(10,32),
  color: colorRefSchema,
  background: styleKeySchema.optional(),     // surface key
  glowRadius: px(0,12),
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

// ---- layout (constraint-based grid, ADR 0007 item 2)
const track = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('fr'), value: z.number().min(0.1).max(12) }),
  z.strictObject({ kind: z.literal('px'), value: px(0,1600) }),
  z.strictObject({ kind: z.literal('minmax'), min: px(0,1600), maxFr: z.number().min(0.1).max(12) }),
  z.strictObject({ kind: z.literal('auto') }),
]);
const areaCell = z.union([z.enum(REGION_IDS), z.literal('.')]);
const layoutVariant = z.strictObject({
  minWidth: px(0,4096),
  columns: z.array(track).min(1).max(SKIN_LIMITS.layoutTracks),
  rows: z.array(track).min(1).max(SKIN_LIMITS.layoutTracks),
  areas: z.array(z.array(areaCell).min(1).max(SKIN_LIMITS.layoutTracks)).min(1).max(SKIN_LIMITS.layoutTracks),
  gap: px(0,32),
  padding: px(0,48),
});
const decor = z.strictObject({
  asset: assetKeySchema,
  target: z.union([z.literal('app'), z.enum(REGION_IDS)]),
  anchor: anchor9,
  offsetX: px(-400,400), offsetY: px(-400,400),
  width: px(1,2000), height: px(1,2000),
  opacity: unit,
  blend,
  layer: z.enum(['behind', 'above']),        // always pointer-events none and aria-hidden
  motion: z.enum(['none', 'drift', 'pulse', 'flicker']),   // trusted keyframes, disabled under prefers-reduced-motion
});
const layout = z.strictObject({
  variants: z.array(layoutVariant).min(1).max(SKIN_LIMITS.layoutVariants),
  decor: z.array(decor).max(SKIN_LIMITS.decorLayers),
});

// ---- component slots (section 9)
const controlRef = z.strictObject({ kind: z.enum(['slider', 'knob']), style: styleKeySchema });
const regionFrame = z.strictObject({
  surface: styleKeySchema,
  inset: px(0,48),
  heading: z.enum(['visible', 'visually-hidden']),   // the h2 always stays in the accessibility tree
});
const components = z.strictObject({
  regions: z.partialRecord(z.enum(REGION_IDS), regionFrame),
  transport: z.strictObject({
    arrangement: z.enum(['row', 'cluster']),
    button: styleKeySchema,                  // previous, stop, next
    playButton: styleKeySchema,              // play-pause toggle
    toggleButton: styleKeySchema,            // shuffle, repeat (uses 'checked' state)
    gap: px(0,24),
  }),
  seek: z.strictObject({
    control: styleKeySchema,                 // horizontal slider
    time: styleKeySchema,                    // display
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
    frame: styleKeySchema.optional(),        // surface key
    placeholder: assetKeySchema.optional(),
  }),
  equalizer: z.strictObject({
    arrangement: z.enum(['bands-then-preamp', 'preamp-first']),
    band: controlRef,                        // slider style must be vertical
    preamp: controlRef,
    bypass: styleKeySchema,                  // switch
    presets: z.enum(['select', 'cycle-button']),
    presetButton: styleKeySchema.optional(), // required with 'cycle-button'
    showGainScale: z.boolean(),
    showFrequencyLabels: z.boolean(),
    showValues: z.boolean(),
  }),
  playlist: z.strictObject({
    rowVariant: z.enum(['compact', 'two-line']),
    rowHeight: px(18,40),
    columns: z.strictObject({ index: z.boolean(), duration: z.boolean(), thumbnail: z.boolean() }),
    header: z.boolean(),
    toolbarButton: styleKeySchema,
    scrollbarWidth: px(6,16),
  }),
  status: z.strictObject({ display: styleKeySchema }),
});

// ---- visualization presentation (no analyser settings)
const gradientStop = z.strictObject({ at: unit, color: paint });
const visualization = z.strictObject({
  defaultMode: z.enum(['spectrum', 'waveform']),
  allowToggle: z.boolean(),
  spectrum: z.strictObject({
    style: z.enum(['bars', 'segments', 'line', 'dots', 'needles']),
    bars: px(16,64),
    barGap: px(0,8),
    segmentHeight: px(2,12),
    peakHold: z.boolean(),
    mirror: z.boolean(),
    stops: z.array(gradientStop).min(2).max(5),
  }),
  waveform: z.strictObject({
    style: z.enum(['line', 'filled', 'dots']),
    lineWidth: px(1,4),
    color: paint,
    glowRadius: px(0,12),
  }),
  needles: z.strictObject({                  // required when spectrum.style is 'needles'
    dial: assetKeySchema,
    needleColor: paint,
    sweepStart: px(-90,0), sweepEnd: px(0,90),
    lengthRatio: z.number().min(0.3).max(1),
  }).optional(),
  surface: styleKeySchema,
  grid: z.boolean(),
  scanlines: z.boolean(),
  frameRate: z.union([z.literal(30), z.literal(60)]),
});

// ---- window decoration (ADR 0009)
const windowDef = z.strictObject({
  decoration: z.literal('custom'),
  minSize: z.strictObject({ width: px(560,1000), height: px(360,700) }),
  preferredSize: z.strictObject({ width: px(560,1920), height: px(360,1200) }),
  titleBar: z.strictObject({
    height: px(24,56),
    surface: styleKeySchema,
    align: z.enum(['start', 'center']),
    controlsSide: z.enum(['start', 'end']),  // ignored on macOS
    buttonStyle: styleKeySchema,             // minimize, maximize/restore, close
    menu: z.enum(['inline', 'collapsed']),   // Windows and Linux in-app menu bar
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
  license: safeTextSchema(64),               // SPDX id of the skin assets
  preview: assetKeySchema.optional(),
  assets: z.record(assetKeySchema, assetDeclSchema),
  icons: z.partialRecord(z.enum(ICON_IDS), assetKeySchema),   // missing icons use trusted built-in glyphs
  tokens,
  surfaces: z.record(styleKeySchema, surface),
  controls,
  layout,
  components,
  visualization,
  window: windowDef,
});
export type SkinManifest = z.infer<typeof skinManifestSchema>;

/** Loose pre-check. Returns the numeric schemaVersion of an object, else null. Never throws. */
export function readSchemaVersion(json: unknown): number | null;
```

Classification: JSON parse failure is `invalid` (`JSON_PARSE`); an object whose `schemaVersion` is a number other than 1 is `incompatible` (`SCHEMA_VERSION`); anything else failing `skinManifestSchema` is `invalid` (`SCHEMA`); then `validateSkinSemantics`.

## 6. Semantic validation (`semantic.ts`, pure)

```ts
export const SKIN_ISSUE_CODES = [
  'SCHEMA', 'SCHEMA_VERSION', 'JSON_PARSE', 'ID_MISMATCH', 'RESERVED_ID',
  'ASSET_TYPE_MISMATCH', 'ASSET_PATH_DUPLICATE', 'ASSET_MISSING_REF', 'ASSET_LIMIT', 'ASSET_KIND',
  'STYLE_MISSING_REF', 'STYLE_LIMIT', 'SURFACE_APP_MISSING', 'REGION_FRAME_MISSING',
  'LAYOUT_NO_BASE_VARIANT', 'LAYOUT_DUPLICATE_MIN_WIDTH', 'LAYOUT_AREAS_SHAPE', 'LAYOUT_AREA_NOT_RECT',
  'LAYOUT_MANDATORY_MISSING', 'LAYOUT_DOES_NOT_FIT',
  'EQ_BAND_NOT_VERTICAL', 'SEEK_NOT_HORIZONTAL', 'KNOB_SWEEP', 'PARAM_MISSING',
  'NEEDLES_MISSING', 'CONTRAST',
  // scanner (main) codes
  'MANIFEST_TOO_LARGE', 'FILE_MISSING', 'FILE_TOO_LARGE', 'FILE_SYMLINK', 'FILE_ESCAPE',
  'MAGIC_MISMATCH', 'IMAGE_TOO_LARGE', 'IMAGE_UNPARSEABLE', 'SVG_UNSAFE', 'TOTAL_TOO_LARGE',
] as const;
export type SkinIssueCode = (typeof SKIN_ISSUE_CODES)[number];
export interface SkinIssue { readonly code: SkinIssueCode; readonly path: string }   // JSON path like 'components.seek.control', never a file path
export function validateSkinSemantics(
  manifest: SkinManifest,
  options?: { readonly allowReservedId?: boolean },     // true only for FOUNDATION_SKIN
): readonly SkinIssue[];
```

Checks (any issue means `invalid`):
1. `id !== 'foundation'` unless `allowReservedId` (`RESERVED_ID`). `surfaces.app` exists (`SURFACE_APP_MISSING`). The scanner adds `ID_MISMATCH` when `id` differs from the directory name.
2. Assets: `type` equals the path extension; at most `assetCount`; no duplicate paths. Every referenced asset key (layers, frames, button faces and state faces, icons, thumbs, slider tracks, knob caps, switch art, decor, preview, needles dial, artwork placeholder, fontAsset) is declared (`ASSET_MISSING_REF`). `fontAsset` must reference a `woff2`; nothing else may reference a `woff2` (`ASSET_KIND`).
3. Style references resolve in the right dictionary (`STYLE_MISSING_REF`): buttons (`transport.button`, `playButton`, `toggleButton`, `volume.muteButton`, `equalizer.presetButton`, `playlist.toolbarButton`, `window.titleBar.buttonStyle`), sliders or knobs per `controlRef.kind`, sliders (`seek.control`), switches (`equalizer.bypass`), displays (`seek.time`, `trackInfo.display`, `status.display`), surfaces (`regions.*.surface`, `artwork.frame`, `displayStyle.background`, `visualization.surface`, `window.titleBar.surface`, `window.frame`). Dictionary sizes within `SKIN_LIMITS.styles` and `surfaces` (`STYLE_LIMIT`).
4. `components.regions` has an entry for every region placed in any layout variant (`REGION_FRAME_MISSING`).
5. Layout per variant: `areas.length === rows.length` and every row length equals `columns.length` (`LAYOUT_AREAS_SHAPE`); every region forms one contiguous rectangle (`LAYOUT_AREA_NOT_RECT`); every `MANDATORY_REGIONS` member appears (`LAYOUT_MANDATORY_MISSING`); exactly one variant has `minWidth: 0` (`LAYOUT_NO_BASE_VARIANT`); `minWidth` values distinct (`LAYOUT_DUPLICATE_MIN_WIDTH`). Fit (`LAYOUT_DOES_NOT_FIT`): for each variant, sum of `px.value` and `minmax.min` columns plus `(columns - 1) * gap + 2 * padding` is at most `max(variant.minWidth, window.minSize.width)`; for the base variant, the same sum over rows is at most `window.minSize.height - titleBar.height`.
6. Orientation: EQ band slider vertical (`EQ_BAND_NOT_VERTICAL`); seek slider horizontal (`SEEK_NOT_HORIZONTAL`); knob `sweepStart < sweepEnd` and needles `sweepStart < sweepEnd` (`KNOB_SWEEP`); `tile` with size `tile`, `segments` with fill `segmented`, `presetButton` with `cycle-button` (`PARAM_MISSING`); `needles` present when style `needles` (`NEEDLES_MISSING`).
7. Contrast with `contrastRatio` (WCAG 2.x, alpha ignored) (`CONTRAST`): at least 4.5 for `text` on `appBg`, `surface`, `surfaceRaised`, `surfaceInset`; `textMuted` on `surface` and `appBg`; `displayText` on `displayBg`; `onAccent` on `accent`; `onRowSelected` on `rowSelected`; `text` on `rowAlt`. At least 3.0 for `focus` on `appBg`, `surface`, `surfaceRaised`, `surfaceInset`, and `accent` on `surface` (non-text control indicator).
8. Text over artwork cannot be checked automatically. art-director documents it per skin; qa-engineer samples it in screenshots.

## 7. Token to CSS custom property mapping (`css-vars.ts`, pure)

```ts
export function skinToCssVariables(
  manifest: SkinManifest,
  assetUrls: Readonly<Record<string, string>>,
): Readonly<Record<`--na-${string}`, string>>;
export function buttonStyleToVars(style: ButtonStyle, urls: AssetUrls): Readonly<Record<string, string>>;
// likewise sliderStyleToVars, knobStyleToVars, switchStyleToVars, displayStyleToVars,
// regionFrameToVars, decorToVars, layoutVariantToGrid (returns { templateColumns, templateRows, templateAreas, gap, padding })
```

Values are built only from validated numbers, hex colors, enum members, quoted validated family names, and URLs that pass `skinAssetUrlSchema`. Any URL failing it is omitted, so a manifest can never cause a `url()` other than `media://skin/<uuid>`.

| Token | Custom property |
|---|---|
| `color.<key>` | `--na-color-<kebab key>`: `app-bg`, `surface`, `surface-raised`, `surface-inset`, `border-subtle`, `border-control`, `text`, `text-muted`, `text-disabled`, `accent`, `on-accent`, `focus`, `danger`, `warning`, `glow`, `display-bg`, `display-text`, `row-alt`, `row-selected`, `on-row-selected` |
| `space.s1..s6` | `--na-space-1` .. `--na-space-6` (px) |
| `shape.*` | `--na-radius-1`, `--na-radius-2`, `--na-border-width`, `--na-focus-ring-width`, `--na-focus-ring-offset`, `--na-control-size` |
| `font.size1..4` | `--na-font-size-1` .. `--na-font-size-4` |
| `font.ui`, `mono`, `display` | `--na-font-family-ui`, `--na-font-family-mono`, `--na-font-family-display` (`"na-skin-<id>-<key>"` first when `fontAsset`, then quoted families, then generic) |
| `font.displayTransform`, `displayTracking` | `--na-display-transform` (`none` or `uppercase`), `--na-display-caps` (`normal` or `small-caps`), `--na-display-tracking` (em) |
| `motion.*` | `--na-duration-fast`, `--na-duration-slow` (ms) |
| asset `<key>` | `--na-asset-<key>: url("media://skin/<uuid>")` |
| surface `<key>` | `--na-surface-<key>-color`, `-image`, `-size`, `-position`, `-repeat`, `-blend`, `-opacity`, `-radius`, `-shadow`, `-frame-source`, `-frame-slice`, `-frame-width`, `-frame-repeat` |

`tokens.css` gains Foundation defaults for every new name (`glow`, `display-*`, `row-*`, `font-family-display`, `display-*` text, durations), equal to the values in `FOUNDATION_SKIN`, so the app renders correctly before any skin applies. Applying: `SkinProvider` sets the global map on the skin root element with `element.style.setProperty` and removes the previous skin's names in the same task. Per-control vars are passed as React `style` objects of custom properties only (CSSOM, allowed by `style-src 'self'`). Variant enums are exposed as `data-variant`, `data-shape`, `data-orientation`, `data-kind` and selected by trusted CSS Modules. Forbidden: `setAttribute('style', ...)`, `<style>` elements, `innerHTML`, `dangerouslySetInnerHTML`, inline SVG from skins.

```ts
// resolved.ts
export const skinAssetUrlSchema = z.string().regex(
  /^media:\/\/skin\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
export const resolvedSkinSchema = z.strictObject({
  manifest: skinManifestSchema,
  assetUrls: z.record(assetKeySchema, skinAssetUrlSchema),
});
export type ResolvedSkin = z.infer<typeof resolvedSkinSchema>;
```

The renderer re-runs `validateSkinSemantics` on every received manifest (receiver-side validation). A failure means Foundation with `fallbackReason: 'invalid'`.

## 8. IPC contract

### 8.1 `src/shared/ipc/channels.ts` additions

```ts
// IPC_CHANNELS (renderer -> main, invoke)
skinsList: 'skins:list',
skinsGetActive: 'skins:get-active',
skinsSetActive: 'skins:set-active',
windowMinimize: 'window:minimize',
windowToggleMaximize: 'window:toggle-maximize',
windowClose: 'window:close',
windowGetState: 'window:get-state',

// IPC_EVENT_CHANNELS (main -> renderer, push only)
skinsChanged: 'skins:changed',
windowStateChanged: 'window:state-changed',
```

`src/shared/ipc/menu.ts`: `MENU_COMMANDS` gains `'open-skin-picker'` (additive).

### 8.2 `src/shared/ipc/skins.ts`

```ts
export const SKIN_FALLBACK_REASONS = ['none-selected', 'missing', 'invalid', 'incompatible', 'load-failed'] as const;
export const skinStatusSchema = z.enum(['ok', 'invalid', 'incompatible']);

export const skinSummarySchema = z.strictObject({
  id: skinIdSchema,
  name: safeTextSchema(48),
  version: z.string().max(16),
  author: safeTextSchema(80),
  description: safeTextSchema(280),
  origin: z.enum(['embedded', 'builtin']),      // 'user' reserved for future third-party skins
  status: skinStatusSchema,
  errorCodes: z.array(z.enum(SKIN_ISSUE_CODES)).max(SKIN_LIMITS.errorCodesPerSkin),
  previewUrl: skinAssetUrlSchema.optional(),
});
export type SkinSummary = z.infer<typeof skinSummarySchema>;
```

For `invalid` or `incompatible` skins whose manifest could not be read, `name` is the directory name, `version` is `'0.0.0'`, `author` and `description` are fixed strings (`'Unknown'`, `'This skin could not be loaded.'`).

```ts
// skins:list
export const skinsListRequestSchema = z.tuple([]);
export const skinsListResponseSchema = ipcResultSchema(z.strictObject({
  skins: z.array(skinSummarySchema).max(SKIN_LIMITS.skinsScanned + 1),   // Foundation first, then by name
  activeId: skinIdSchema,
}));

// skins:get-active
export const skinsGetActiveRequestSchema = z.tuple([]);
export const activeSkinSchema = z.strictObject({
  activeId: skinIdSchema,
  requestedId: skinIdSchema.nullable(),                       // stored preference, null when none
  fallbackReason: z.enum(SKIN_FALLBACK_REASONS).optional(),   // present iff activeId !== requestedId
  skin: resolvedSkinSchema,
});
export type ActiveSkin = z.infer<typeof activeSkinSchema>;
export const skinsGetActiveResponseSchema = ipcResultSchema(activeSkinSchema);

// skins:set-active
export const skinsSetActiveRequestSchema = z.tuple([z.strictObject({ skinId: skinIdSchema })]);
export const skinsSetActiveResponseSchema = ipcResultSchema(z.discriminatedUnion('applied', [
  z.strictObject({ applied: z.literal(true), active: activeSkinSchema, persisted: z.boolean() }),
  z.strictObject({ applied: z.literal(false), reason: z.enum(['unknown-skin', 'invalid', 'incompatible']) }),
]));

// skins:changed (push). Sent after any change not initiated by this renderer's set-active call (native View menu).
export const skinsChangedEventSchema = activeSkinSchema;
```

Behavior: `set-active` on a skin that is not `ok` returns `applied: false` and changes nothing. `persisted: false` means the skin is active for this session but `skin-preference.json` could not be written; the renderer shows a status message. Foundation (`'foundation'`) is always `ok` and selectable. No payload contains a filesystem path, exception text or stack.

### 8.3 `src/shared/ipc/window.ts`

```ts
export const windowActionRequestSchema = z.tuple([]);   // minimize, toggle-maximize, close
export const windowActionResponseSchema = ipcResultSchema(z.strictObject({ applied: z.literal(true) }));
export const windowStateSchema = z.strictObject({
  maximized: z.boolean(), fullScreen: z.boolean(), focused: z.boolean(),
  platform: z.enum(['win32', 'darwin', 'linux']),      // renderer hides its own buttons on darwin
});
export type WindowState = z.infer<typeof windowStateSchema>;
export const windowGetStateRequestSchema = z.tuple([]);
export const windowGetStateResponseSchema = ipcResultSchema(windowStateSchema);
export const windowStateChangedEventSchema = windowStateSchema;
```

### 8.4 Preload bridge additions (`NecroampApi`)

```ts
readonly skins: {
  readonly list: () => Promise<unknown>;
  readonly getActive: () => Promise<unknown>;
  readonly setActive: (request: { readonly skinId: string }) => Promise<unknown>;
  readonly onChanged: (listener: (event: ActiveSkin) => void) => () => void;
};
readonly window: {
  readonly minimize: () => Promise<unknown>;
  readonly toggleMaximize: () => Promise<unknown>;
  readonly close: () => Promise<unknown>;
  readonly getState: () => Promise<unknown>;
  readonly onStateChanged: (listener: (state: WindowState) => void) => () => void;
};
```

The preload validates push payloads with the shared schemas before calling listeners (as `menu.onCommand`), drops invalid ones, and returns idempotent unsubscribers. It forwards only the fixed `{ skinId }` shape. No generic invoke, no `ipcRenderer`. Every handler goes through `registerHandler` with `isTrustedSender` and request and response schemas (ADR 0005).

### 8.5 Main behavior (desktop-engineer)

- `src/main/skins/`: `skin-roots.ts` (builtin root resolution), `skin-scanner.ts`, `asset-inspect.ts` (magic bytes, raster dimensions), `skin-registry.ts` (records and `skin` token store), `skin-preference.ts` (`userData/skin-preference.json`, `{ schemaVersion: 1, skinId }`, strict, atomic temp plus rename, serialized), `skin-service.ts` (`list()`, `getActive()`, `setActive(id)`, `onChange(listener)`). Injected `fs`, `pathApi`, `log`. Unit tested with an in-memory fs. Logs carry codes only.
- Scanner flow per child of the root (sorted, at most `skinsScanned`): directory name matches `skinIdSchema` and is not `foundation`; `lstat` not a symlink; `skin.json` `lstat` regular file, size at most `manifestBytes`; read, UTF-8 decode (fatal), `JSON.parse`, classify (section 5), semantic, then assets (section 4). Only the first `registeredSkins` ok skins are registered.
- `media-protocol.ts`: `MediaHost = 'track' | 'art' | 'skin'`, URL regex `(track|art|skin)`. `media-handler.ts`: `skin` branch per ADR 0008 item 4 (re-validate on serve, declared type, SVG response CSP header, `Sec-Fetch-Dest` rule, no Range). `csp.ts`: production `img-src 'self' media://art media://skin` and `font-src 'self' media://skin`; development derives from production as today.
- `app-menu.ts`: View menu always present. Items: `Skin` submenu of `type: 'radio'` entries (id `skin:<id>`, label = skin name, checked = active, enabled = status ok), a separator, `Skins…` (sends `menu:command` `open-skin-picker`), then the dev-only reload and DevTools. A radio click calls `skinService.setActive`, which pushes `skins:changed`. `AppMenuController` gains `setActiveSkin(id)`. `MenuDescriptor` gains `type: 'radio'` and `checked`.
- `chrome-profile.ts`: `ChromeProfile = { kind: 'native' } | { kind: 'frameless' }`; production uses `frameless`. `buildWindowOptions(profile, constraints)` with `constraints = { minWidth, minHeight, width, height }` from the active skin (Foundation 800 by 600 minimum, 1100 by 720 preferred). Frameless: `frame: false` on win32 and linux, `titleBarStyle: 'hidden'` on darwin, `autoHideMenuBar: false`. `buildWebPreferences` unchanged.
- `window-handlers.ts`: resolves the window from the validated sender (`BrowserWindow.fromWebContents`), never from the payload. Pushes `window:state-changed` on `maximize`, `unmaximize`, `enter-full-screen`, `leave-full-screen`, `focus`, `blur`. After any skin change: `setMinimumSize` with the clamped skin minimum, and enlarge when the window is smaller and not maximized or full screen.
- Startup: existing order, plus preference read and skin scan before window creation (so the first window uses the skin's size). Skin tokens cleared on window close with the other registries. A scan failure of any kind leaves Foundation active and is logged by code.

## 9. Semantic component slots and variants every skin must fill

The schema requires every slot. Foundation fills them with plain values. Each slot has a fixed interactive contract implemented once in trusted code; skins change only presentation.

| Slot (`data-slot`) | Region | Variants and parameters | Interactive contract (identical in every skin) |
|---|---|---|---|
| `title-bar` | none, above the grid | `window.titleBar` (surface, height, align, controlsSide, buttonStyle, menu, titleVisible), `window.frame`, `resizeGrip` | Drag region, minimize, maximize or restore, close with accessible names; `role="menubar"` File and View on Windows and Linux; keyboard reachable; hidden own buttons on macOS |
| `transport` | `transport` | `arrangement` row or cluster; `button`, `playButton`, `toggleButton` styles; `gap`; icons | Buttons with `aria-label`; play-pause and toggles expose `aria-pressed`; repeat cycles off, all, one as today |
| `seek` | `seek` | horizontal slider style, time display style, `timePlacement` | `role="slider"` with `aria-valuetext` (elapsed of total), arrows 5 s, Home and End; disabled with no track |
| `volume` | `volume` | `slider` or `knob`; mute button or none | `role="slider"` 0 to 100, arrows 1, PageUp and PageDown 10, Home and End; mute toggle `aria-pressed` |
| `track-info` | `track-info` | `stacked`, `marquee-line`, `lcd-two-line`, `plaque`; display style; `showAlbum` | Text only; marquee scrolls only on overflow and never under `prefers-reduced-motion`; full text always readable by assistive tech |
| `artwork` | `artwork` | `plain`, `framed`, `bezel`, `arched`, `round`; frame surface; placeholder asset | `img` with alt from metadata; placeholder is decorative (`alt=""`) |
| `equalizer` | `equalizer` | `arrangement`; band `slider` (vertical) or `knob`; preamp `slider` or `knob`; bypass switch; presets `select` or `cycle-button`; scale, frequency labels, values | 10 bands and preamp each `role="slider"` with dB `aria-valuetext`, arrows 0.5 dB, PageUp and PageDown 3 dB, Home and End to the clamp limits from `@shared/audio/eq`; bypass `role="switch"`; presets labelled |
| `playlist` | `playlist` | `compact` or `two-line`; `rowHeight`; columns index, duration, thumbnail; header; toolbar button; scrollbar width | Existing semantics, selection, Enter plays, Delete removes, reorder as today; the only scrolling region of the shell |
| `visualization` | `visualization` | spectrum `bars`, `segments`, `line`, `dots`, `needles`; waveform `line`, `filled`, `dots`; surface, grid, scanlines, frame rate | `canvas` with `aria-label`; mode toggle button when `allowToggle`; drawing paused when hidden (existing loop) |
| `status` | `status` | display style | `role="status"` for bridge and engine state; errors `role="alert"` as today |
| `github` (optional) | `github` | region frame only | unchanged placeholder |

Mandatory differences of the bundled skins (Spec R12, R13):
- **Foundation** (embedded, `origin: 'embedded'`, no assets): `rect` and `rounded-rect` buttons, `row` transport, plain sliders, slider volume, `stacked` track info, `plain` artwork, `compact` rows, `bars` spectrum, `line` waveform, `inline` menu, tokens equal to today's `tokens.css` tier 2 values. A compact player layout (no admin dashboard header, no `skin-selector` region, playlist as the single scroller).
- **Morgul Revenant**: `diamond` and `arch` buttons, `cluster` transport, vertical `segmented` green-lit EQ sliders, `framed` or `arched` artwork, `plaque` track info with a serif small-caps display stack, `segments` spectrum with spectral stops, dark `compact` playlist, mist `decor` with `drift`, carved title bar with `center` alignment.
- **Analog 1984**: `circle` and `rounded-rect` hardware buttons, `knob` volume and preamp, vertical faders with `ticks` for bands, `lever` or `rocker` bypass, `seven-segment` time and `lcd-two-line` track info, `needles` spectrum (VU) as default with a toggle, `bezel` or `round` artwork, `two-line` playlist, brushed-metal SVG filter surfaces, `start`-aligned title bar, a layout distinct from Morgul (equipment rack rows).

## 10. Audio independence rules (mechanical)

1. `src/renderer/audio/**` and `src/shared/audio/**` import nothing from `@shared/skins`, `@shared/ipc/skins`, `@shared/ipc/window`, `@renderer/app/**`, `@renderer/features/**` or `@renderer/components/**`. Enforced by ESLint `no-restricted-imports` zones (orchestrator, architect review).
2. The manifest has no field for FFT size, smoothing, band frequencies, gains, filter types, element or context handling. Visualization fields are drawing parameters only.
3. `AudioEngine`, `AudioProcessing`, `PlayerStore`, `PlaylistStore` and `EqStore` are created once in `src/renderer/main.tsx` and provided above `SkinProvider`. No component under the skin tree creates, resumes, closes or reconnects audio objects.
4. A skin switch changes only CSS variables, the layout variant, `data-*` attributes, loaded fonts, and which presentational components are mounted. Visualizer canvases subscribe and unsubscribe through the existing visual loop and never dispose the graph.
5. Primitives under `src/renderer/components/**` are pure: props in, callbacks out, no store, audio or IPC imports.

## 11. Renderer runtime (frontend-engineer)

```
src/renderer/app/skin/     skin-store.ts, skin-port.ts, skin-provider.tsx, apply-skin.ts, layout-engine.tsx, skin-context.ts
src/renderer/app/chrome/   window-chrome.tsx, window-menubar.tsx, use-window-state.ts
src/renderer/components/   button/, slider/, knob/, switch/, display/, surface/, icon/ (presentational primitives)
src/renderer/features/skins/ skin-picker.tsx (dialog), use-skins.ts
```

- Bootstrap: `main.tsx` builds engine and stores once, then `SkinProvider` calls `skins:get-active` with a 1500 ms timeout. Failure or timeout means `FOUNDATION_SKIN` with `fallbackReason: 'load-failed'`. The shell renders after the first resolution (no flash of a wrong skin).
- Fallback: an error boundary around the skinned subtree re-renders with `FOUNDATION_SKIN` and a `role="alert"` message on a render error. The stored preference is not changed. Audio providers sit outside this boundary, so a fallback does not remount them.
- Switch: `setActive`, then apply in one task (remove old vars, set new vars, swap fonts after `FontFace.load()` resolves or after 1000 ms, then swap the layout). On `applied: false`, keep the current skin and show the reason in the status region and the picker. Announce `Skin changed to <name>` through `aria-live="polite"`. No crossfade under `prefers-reduced-motion`.
- Layout: `ResizeObserver` on the shell picks the variant with the largest `minWidth` not above the width and writes `grid-template-*` through CSSOM. Only the playlist body scrolls; every other region sets `overflow: hidden` and fits its content by design (validated by the fit rule and screenshots).
- Skin picker: opened from View > `Skins…` (native menu and in-app menubar). `role="dialog"`, `aria-modal="true"`, focus trap and restore, labelled radio group of cards (preview or token swatches, name, version, author, description, status). Non-`ok` cards are disabled and list their error codes as text. Arrow keys move, Enter or Space applies, Escape closes. The current skin is preselected.
- Test hooks kept: `data-testid={regionId}`, `data-region`, `data-part`. New: `data-slot`, `data-variant`, `data-skin` (root only, never used as a style selector for skin values).

## 12. Test identifiers

Unit and property file stems: `asset-path`, `manifest`, `semantic`, `svg-safety`, `css-vars`, `contrast`, `foundation-skin`, `skin-scanner`, `asset-inspect`, `skin-registry`, `skin-preference`, `skin-service`, `skins-handlers`, `window-handlers`, `media-handler.skin`, `media-protocol` (extended), `csp` (extended), `app-menu` (extended), `window-options` (extended), `skin-store`, `skin-provider`, `apply-skin`, `layout-engine`, `window-chrome`, `skin-picker`, `button`, `slider`, `knob`, `switch`, `display`, `bundled-skins` (scans the real `skins/` directory and asserts every bundled skin is `ok` and every declared asset path appears in `docs/assets.md`).

Property tests (qa-engineer, `*.property.test.ts`): arbitrary JSON never throws in `readSchemaVersion`, `skinManifestSchema.safeParse` or `validateSkinSemantics`; `isSafeAssetPath` never accepts a string containing `..`, `\`, `:`, `%`, a leading `/`, or a non-`assets/` prefix; `validateSvg` never throws and rejects any input containing a forbidden element, an `on*` attribute or a non-fragment reference; `skinToCssVariables` output never contains `url(` other than `url("media://skin/<uuid>")`, never contains `;`, `{`, `}` or `\`; area rectangle check agrees with a brute-force oracle.

E2E (`tests/e2e/skin-*.spec.ts`): Foundation by default; switch to each skin through the in-app View menu, and through the native path via the skin service test hook if the native menu cannot be driven; playback continuity (tone playing, `currentTime` increases across the switch, no `pause` or `ended`, same track, playlist order, volume, EQ values); restart persistence (separate `userData`); invalid preferred skin falls back (fixture `skin-preference.json` with an unknown id, and one with a corrupt body); window buttons and keyboard; File menu commands; screenshots for each skin at 1100 by 720, at its minimum size, and at 1400 by 900 under `docs/testing/screenshots/skin-engine/`.

## 13. Out of scope (deferred, record in backlog)

Third-party skin installation, skin archives, `.wsz` import, bundled font files, a `userData/skins` root, hot reload, per-skin sounds, EQ persistence, window position persistence, packaging `extraResources` for `skins/` (D2), macOS and Linux verification of frameless chrome, Windows 11 snap-layout flyout.

## 14. Contract change notes required (for `docs/architecture/contract-changes.md`)

- `REGION_IDS` moves to `@shared/skins` and changes members (`player`, `skin-selector` removed; `track-info`, `artwork`, `transport`, `seek`, `volume`, `status` added). Consumers: `src/renderer/components/region-frame/region-ids.ts`, `src/renderer/app/shell-layout.ts`, `app-shell.tsx`, region components, E2E selectors using `data-testid="player"` or `"skin-selector"`. Migration: `PlayerRegion` becomes five region components sharing `use-player`; E2E selectors updated by qa-engineer.
- `contrastRatio` moves to `@shared/skins/contrast.ts`; `src/renderer/app/theme/contrast.ts` re-exports. No behavior change.
- `MediaHost` widens with `skin`; `parseMediaUrl` accepts `media://skin/<uuid>`. Existing tests for rejecting other hosts must drop `skin` from the reject set.
- `MENU_COMMANDS` and `MenuDescriptor` additive. `ChromeProfile` gains `frameless`; `buildWindowOptions` gains a constraints argument.
