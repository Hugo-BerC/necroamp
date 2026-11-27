import { skinManifestSchema, type SkinManifest } from '@shared/skins';

/**
 * Embedded Foundation skin (ADR 0007, 0008). It declares no assets, so it needs no file access and
 * is always available as the fallback. The values mirror `src/renderer/app/styles/tokens.css`.
 *
 * Contract note: the contract places `FOUNDATION_SKIN` in `@shared/skins`, which does not export it
 * yet. This main-local copy is parsed by `skinManifestSchema` at module load, so it can never drift
 * from the schema silently. Replace it with the shared constant when that lands.
 */
export const FOUNDATION_SKIN_ID = 'foundation';

const state = { brightness: 1, offsetY: 0, glow: 0 };
const pressed = { brightness: 0.85, offsetY: 1, glow: 0 };
const hover = { brightness: 1.2, offsetY: 0, glow: 0 };
const disabled = { brightness: 0.6, offsetY: 0, glow: 0 };

const button = (shape: 'rect' | 'rounded-rect', width: number, height: number) => ({
  shape,
  width,
  height,
  iconScale: 0.55,
  states: { normal: state, hover, pressed, disabled, checked: { ...state, glow: 0.4 } },
});

const slider = (orientation: 'horizontal' | 'vertical') => ({
  orientation,
  thickness: 6,
  fill: 'solid' as const,
  fillColor: 'accent' as const,
  thumb: { shape: 'circle' as const, width: 14, height: 14 },
  ticks: false,
});

const display = (font: 'ui' | 'mono', fontSize: number) => ({
  kind: 'text' as const,
  font,
  fontSize,
  color: 'text' as const,
  glowRadius: 0,
  letterSpacing: 0,
  uppercase: false,
  scanlines: false,
});

const frame = (heading: 'visible' | 'visually-hidden') => ({
  surface: 'panel',
  inset: 8,
  heading,
});

const FOUNDATION_CANDIDATE = {
  schemaVersion: 1,
  id: FOUNDATION_SKIN_ID,
  name: 'Foundation',
  version: '1.0.0',
  author: 'NecroAmp',
  description: 'The neutral built-in skin. Always available as the fallback.',
  license: 'MIT',
  assets: {},
  icons: {},
  tokens: {
    color: {
      appBg: '#121417',
      surface: '#1a1d21',
      surfaceRaised: '#232830',
      surfaceInset: '#0d1012',
      borderSubtle: '#2c323b',
      borderControl: '#6b7482',
      text: '#e6e9ee',
      textMuted: '#9aa3ae',
      textDisabled: '#7a8391',
      accent: '#5cc8c0',
      onAccent: '#0d1012',
      focus: '#7fb4ff',
      danger: '#ff8a80',
      warning: '#f0c674',
      glow: '#5cc8c0',
      displayBg: '#0d1012',
      displayText: '#5cc8c0',
      rowAlt: '#171a1e',
      rowSelected: '#2c323b',
      onRowSelected: '#e6e9ee',
    },
    space: { s1: 2, s2: 4, s3: 8, s4: 12, s5: 16, s6: 24 },
    shape: {
      radius1: 2,
      radius2: 4,
      borderWidth: 1,
      focusRingWidth: 2,
      focusRingOffset: 2,
      controlSize: 36,
    },
    font: {
      size1: 11,
      size2: 12,
      size3: 14,
      size4: 20,
      ui: { families: ['Segoe UI', 'Roboto'], generic: 'system-ui' },
      mono: { families: ['Cascadia Mono', 'Consolas'], generic: 'monospace' },
      display: { families: ['Segoe UI', 'Roboto'], generic: 'system-ui' },
      displayTransform: 'none',
      displayTracking: 0,
    },
    motion: { durationFast: 100, durationSlow: 250 },
  },
  surfaces: {
    app: { color: '#121417', layers: [], shadow: 'none' },
    panel: { color: '#1a1d21', layers: [], radius: 4, shadow: 'none' },
    inset: { color: '#0d1012', layers: [], radius: 2, shadow: 'inset' },
    titlebar: { color: '#1a1d21', layers: [], shadow: 'none' },
  },
  controls: {
    buttons: {
      transport: button('rounded-rect', 36, 36),
      play: button('rounded-rect', 44, 36),
      titlebar: button('rect', 40, 28),
    },
    sliders: {
      seek: slider('horizontal'),
      volume: slider('horizontal'),
      band: slider('vertical'),
    },
    knobs: {},
    switches: {
      bypass: {
        kind: 'led-button',
        width: 56,
        height: 28,
        ledColor: 'accent',
        label: 'inline',
      },
    },
    displays: { time: display('mono', 12), info: display('ui', 14) },
  },
  layout: {
    variants: [
      {
        minWidth: 0,
        columns: [
          { kind: 'px', value: 140 },
          { kind: 'fr', value: 1 },
          { kind: 'px', value: 200 },
        ],
        rows: [
          { kind: 'auto' },
          { kind: 'auto' },
          { kind: 'auto' },
          { kind: 'px', value: 150 },
          { kind: 'minmax', min: 120, maxFr: 1 },
        ],
        areas: [
          ['artwork', 'track-info', 'track-info'],
          ['artwork', 'transport', 'volume'],
          ['seek', 'seek', 'seek'],
          ['visualization', 'equalizer', 'equalizer'],
          ['playlist', 'playlist', 'playlist'],
        ],
        gap: 8,
        padding: 8,
      },
    ],
    decor: [],
  },
  components: {
    regions: {
      'track-info': frame('visually-hidden'),
      artwork: frame('visually-hidden'),
      transport: frame('visually-hidden'),
      seek: frame('visually-hidden'),
      volume: frame('visually-hidden'),
      visualization: frame('visually-hidden'),
      equalizer: frame('visible'),
      playlist: frame('visible'),
    },
    transport: {
      arrangement: 'row',
      button: 'transport',
      playButton: 'play',
      toggleButton: 'transport',
      gap: 4,
    },
    seek: { control: 'seek', time: 'time', timePlacement: 'inline-end' },
    volume: { control: { kind: 'slider', style: 'volume' }, muteButton: 'transport' },
    trackInfo: { variant: 'stacked', display: 'info', showAlbum: true },
    artwork: { variant: 'plain' },
    equalizer: {
      arrangement: 'bands-then-preamp',
      band: { kind: 'slider', style: 'band' },
      preamp: { kind: 'slider', style: 'band' },
      bypass: 'bypass',
      presets: 'select',
      showGainScale: true,
      showFrequencyLabels: true,
      showValues: true,
    },
    playlist: {
      rowVariant: 'compact',
      rowHeight: 24,
      columns: { index: true, duration: true, thumbnail: false },
      header: true,
      toolbarButton: 'transport',
      scrollbarWidth: 10,
    },
    status: { display: 'time' },
  },
  visualization: {
    defaultMode: 'spectrum',
    allowToggle: true,
    spectrum: {
      style: 'bars',
      bars: 32,
      barGap: 1,
      segmentHeight: 4,
      peakHold: true,
      mirror: false,
      stops: [
        { at: 0, color: 'accent' },
        { at: 1, color: 'text' },
      ],
    },
    waveform: { style: 'line', lineWidth: 2, color: 'accent', glowRadius: 0 },
    surface: 'inset',
    grid: false,
    scanlines: false,
    frameRate: 60,
  },
  window: {
    decoration: 'custom',
    minSize: { width: 800, height: 600 },
    preferredSize: { width: 1100, height: 720 },
    titleBar: {
      height: 32,
      surface: 'titlebar',
      align: 'start',
      controlsSide: 'end',
      buttonStyle: 'titlebar',
      menu: 'inline',
      titleVisible: true,
    },
    resizeGrip: false,
  },
};

export const FOUNDATION_MANIFEST: SkinManifest = skinManifestSchema.parse(FOUNDATION_CANDIDATE);
