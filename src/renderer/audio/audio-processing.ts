import { DEFAULT_EQ_SETTINGS, sanitizeEqSettings, type EqSettings } from '@shared/audio/eq';
import { createAudioGraph, type AudioGraph } from './graph';

export type AudioContextStatus = 'none' | 'suspended' | 'running' | 'closed' | 'interrupted';

/**
 * Audio processing port: equalizer, preamp, bypass, master gain and analyser data.
 * It knows nothing about playback state, tracks or drawing. Settings given before the graph
 * exists are kept and applied when it is built.
 */
export interface AudioProcessing {
  /**
   * Builds the graph (once) and resumes the context. Call from a user gesture, for example
   * the play click. Resolves `false` when Web Audio is unavailable or the graph failed;
   * playback then continues through the element without EQ or analysis.
   */
  readonly ensureReady: () => Promise<boolean>;
  /** Stores and applies equalizer settings (invalid values are sanitized). */
  readonly setEq: (settings: EqSettings) => void;
  readonly getEq: () => EqSettings;
  /** Master gain in [0, 1]. Returns false when no graph exists yet (caller keeps another path). */
  readonly setMasterGain: (linear: number) => boolean;
  readonly isGraphActive: () => boolean;
  readonly getContextStatus: () => AudioContextStatus;
  /** Returns an unsubscribe function. */
  readonly subscribeContextStatus: (listener: (status: AudioContextStatus) => void) => () => void;
  /** Reused buffer, valid until the next call. `null` before the graph exists. */
  readonly getFrequencyData: () => Uint8Array | null;
  /** Reused buffer, valid until the next call. `null` before the graph exists. */
  readonly getWaveformData: () => Uint8Array | null;
  /** Sample rate of the context, `null` before the graph exists. */
  readonly getSampleRate: () => number | null;
  /** Disconnects all nodes, closes the context, removes listeners. Idempotent. */
  readonly dispose: () => void;
}

export interface AudioProcessingOptions {
  readonly element: HTMLMediaElement;
  /** Injection point for tests. Defaults to `new AudioContext({ latencyHint: 'playback' })`. */
  readonly createContext?: () => AudioContext;
  readonly doc?: Document;
}

/** `playback` favors glitch-free output over latency; the player has no input monitoring. */
export const AUDIO_LATENCY_HINT = 'playback' as const;

function defaultCreateContext(): AudioContext {
  return new AudioContext({ latencyHint: AUDIO_LATENCY_HINT });
}

export function createAudioProcessing(options: AudioProcessingOptions): AudioProcessing {
  const { element } = options;
  const doc = options.doc ?? document;
  const createContext = options.createContext ?? defaultCreateContext;

  let eq: EqSettings = DEFAULT_EQ_SETTINGS;
  let masterGain = 1;
  let context: AudioContext | null = null;
  let graph: AudioGraph | null = null;
  let frequencyBuffer: Uint8Array | null = null;
  let waveformBuffer: Uint8Array | null = null;
  let disposed = false;
  let failed = false;
  let pending: Promise<boolean> | null = null;
  const statusListeners = new Set<(status: AudioContextStatus) => void>();

  const status = (): AudioContextStatus => (context === null ? 'none' : context.state);
  const emitStatus = (): void => {
    const current = status();
    for (const listener of [...statusListeners]) {
      listener(current);
    }
  };
  const onVisible = (): void => {
    // Sleep or device changes can leave the context suspended while the element plays.
    if (!doc.hidden && context?.state === 'suspended' && !element.paused) {
      context.resume().catch(() => undefined);
    }
  };
  doc.addEventListener('visibilitychange', onVisible);

  const build = async (): Promise<boolean> => {
    if (disposed || failed) {
      return false;
    }
    try {
      if (context === null) {
        context = createContext();
        context.addEventListener('statechange', emitStatus);
      }
      if (graph === null) {
        graph = createAudioGraph(context, element, eq, masterGain);
        // Allocated once; the analyser size is fixed at graph creation.
        frequencyBuffer = new Uint8Array(graph.analyser.frequencyBinCount);
        waveformBuffer = new Uint8Array(graph.analyser.fftSize);
      }
    } catch {
      // Web Audio unavailable or element already bound. Fall back to element-only playback.
      failed = true;
      teardown();
      return false;
    }
    // Once the element feeds the graph its output only exists through the context, so a
    // failed resume keeps the graph and is retried on the next gesture.
    try {
      if (context.state === 'suspended') {
        await context.resume();
      }
    } catch {
      return false;
    }
    emitStatus();
    return !disposed;
  };

  const teardown = (): void => {
    graph?.dispose();
    graph = null;
    frequencyBuffer = null;
    waveformBuffer = null;
    if (context !== null) {
      context.removeEventListener('statechange', emitStatus);
      if (context.state !== 'closed') {
        context.close().catch(() => undefined);
      }
      context = null;
    }
  };

  return {
    ensureReady: () => {
      pending ??= build().finally(() => {
        pending = null;
      });
      return pending;
    },
    setEq: (settings) => {
      eq = sanitizeEqSettings(settings);
      graph?.applyEq(eq);
    },
    getEq: () => eq,
    setMasterGain: (linear) => {
      masterGain = Number.isFinite(linear) ? Math.min(1, Math.max(0, linear)) : 0;
      if (graph === null) {
        return false;
      }
      graph.setMasterGain(masterGain);
      return true;
    },
    isGraphActive: () => graph !== null,
    getContextStatus: status,
    subscribeContextStatus: (listener) => {
      statusListeners.add(listener);
      return () => {
        statusListeners.delete(listener);
      };
    },
    getFrequencyData: () => {
      if (graph === null || frequencyBuffer === null) return null;
      graph.analyser.getByteFrequencyData(frequencyBuffer as Uint8Array<ArrayBuffer>);
      return frequencyBuffer;
    },
    getWaveformData: () => {
      if (graph === null || waveformBuffer === null) return null;
      graph.analyser.getByteTimeDomainData(waveformBuffer as Uint8Array<ArrayBuffer>);
      return waveformBuffer;
    },
    getSampleRate: () => graph?.sampleRate ?? null,
    dispose: () => {
      if (disposed) return;
      disposed = true;
      doc.removeEventListener('visibilitychange', onVisible);
      teardown();
      statusListeners.clear();
    },
  };
}
