import type { Platform } from '@shared/ipc';
import type { AppInfoFailureReason, AppInfoStatus } from '@renderer/stores/app-info-store';
import type { RegionId } from '@renderer/components/region-frame';

/** All user-facing text. Keys are stable ids so a later i18n layer can replace this file. */
export const STRINGS = {
  appName: 'NecroAmp',
  tagline: 'Code. Listen. Repeat.',
  notImplemented: 'Not implemented in this phase',
  notAvailable: 'Not available',
  activationMessage: (label: string): string => `${label}: not implemented in this phase.`,
  regionFailed: 'This section failed to load. The rest of the application is still usable.',
  header: {
    appInfoLabel: 'Application information',
    statusLabel: 'Status indicators',
    version: 'Version',
    platform: 'Platform',
    bridge: 'Application bridge',
    audioEngine: 'Audio engine',
    audioEngineValue: 'Not implemented in this phase',
  },
  bridgeStatus: {
    idle: 'Waiting to start',
    loading: 'Loading application information',
    loaded: 'Connected',
    failed: 'Application information could not be loaded',
    unavailable: 'The application bridge is unavailable. Running without it.',
  } satisfies Record<AppInfoStatus, string>,
  bridgeFailure: {
    unavailable: 'The application bridge is unavailable. Running without it.',
    rejected: 'The application did not respond.',
    'invalid-response': 'The application returned an unexpected response.',
    'ipc-error': 'The application refused the request.',
  } satisfies Record<AppInfoFailureReason, string>,
  platforms: {
    win32: 'Windows',
    darwin: 'macOS',
    linux: 'Linux',
  } satisfies Record<Platform, string>,
  regions: {
    player: 'Player',
    playlist: 'Playlist',
    equalizer: 'Equalizer',
    visualization: 'Visualizer',
    'skin-selector': 'Skins',
    github: 'GitHub (optional)',
  } satisfies Record<RegionId, string>,
  player: {
    nowPlaying: 'Now playing',
    transport: 'Transport controls',
    titleLabel: 'Title',
    artistLabel: 'Artist',
    positionLabel: 'Position',
    noTrack: 'No track loaded',
    noArtist: 'Unknown',
    controls: {
      previous: 'Previous',
      play: 'Play',
      pause: 'Pause',
      stop: 'Stop',
      next: 'Next',
    },
  },
  playlist: {
    empty: 'The playlist is empty. Playlists are not implemented in this phase.',
    addFiles: 'Add files',
    savePlaylist: 'Save playlist',
  },
  equalizer: {
    bands: 'Equalizer bands',
    band: (index: number): string => `Band ${index}`,
    frequencies: [
      '31 Hz',
      '62 Hz',
      '125 Hz',
      '250 Hz',
      '500 Hz',
      '1 kHz',
      '2 kHz',
      '4 kHz',
      '8 kHz',
      '16 kHz',
    ],
    unavailable: 'Equalizer is not implemented in this phase. No audio is processed.',
  },
  visualizer: {
    spectrum: 'Spectrum',
    waveform: 'Waveform',
    unavailable: 'Visualizations are not implemented in this phase. There is no audio to show.',
  },
  skins: {
    none: 'No skins are available. Skin selection is not implemented in this phase.',
    choose: 'Choose skin',
  },
  github: {
    optional: 'GitHub features are optional. NecroAmp works fully without signing in.',
    signIn: 'Sign in with GitHub',
  },
} as const;
