import {
  EQ_BANDS,
  EQ_PEAKING_Q,
  EQ_SMOOTHING_TIME_CONSTANT_S,
  clampFrequencyHz,
  dbToLinear,
  effectiveGains,
  type EqSettings,
} from '@shared/audio/eq';
import {
  ANALYSER_FFT_SIZE,
  ANALYSER_MAX_DECIBELS,
  ANALYSER_MIN_DECIBELS,
  ANALYSER_SMOOTHING,
} from '@shared/audio/visualizer-data';

/**
 * Persistent signal graph (tech.md, "Audio engineering rules"):
 * source -> 10 biquads -> preamp gain -> master gain -> analyser -> destination.
 * Built once per element. Settings change parameters only, never the topology.
 * No AudioWorklet: native nodes cover every requirement (spec C8).
 */
export interface AudioGraph {
  readonly analyser: AnalyserNode;
  readonly sampleRate: number;
  /** Applies bypass-aware band and preamp gains with smoothing. */
  readonly applyEq: (settings: EqSettings) => void;
  /** Linear master gain in [0, 1], smoothed. */
  readonly setMasterGain: (linear: number) => void;
  /** Disconnects every node. Idempotent. The context is owned and closed by the caller. */
  readonly dispose: () => void;
}

/** Highest linear master gain accepted. Master gain never boosts. */
export const MASTER_GAIN_MAX = 1;

function smooth(param: AudioParam, value: number, now: number): void {
  param.setTargetAtTime(value, now, EQ_SMOOTHING_TIME_CONSTANT_S);
}

export function createAudioGraph(
  context: AudioContext,
  element: HTMLMediaElement,
  initial: EqSettings,
  initialMasterGain: number,
): AudioGraph {
  const source = context.createMediaElementSource(element);
  const filters = EQ_BANDS.map((band) => {
    const filter = context.createBiquadFilter();
    filter.type = band.type;
    filter.frequency.value = clampFrequencyHz(band.frequencyHz, context.sampleRate);
    filter.Q.value = EQ_PEAKING_Q;
    filter.gain.value = 0;
    return filter;
  });
  const preamp = context.createGain();
  const master = context.createGain();
  const analyser = context.createAnalyser();
  analyser.fftSize = ANALYSER_FFT_SIZE;
  analyser.smoothingTimeConstant = ANALYSER_SMOOTHING;
  analyser.minDecibels = ANALYSER_MIN_DECIBELS;
  analyser.maxDecibels = ANALYSER_MAX_DECIBELS;

  const chain: AudioNode[] = [source, ...filters, preamp, master, analyser];
  for (let i = 0; i < chain.length - 1; i += 1) {
    chain[i]?.connect(chain[i + 1] as AudioNode);
  }
  analyser.connect(context.destination);

  // Initial values are set directly (nothing is audible yet), later changes are smoothed.
  const first = effectiveGains(initial);
  filters.forEach((filter, i) => {
    filter.gain.value = first.bands[i] ?? 0;
  });
  preamp.gain.value = dbToLinear(first.preampDb);
  master.gain.value = Math.min(MASTER_GAIN_MAX, Math.max(0, initialMasterGain));

  let disposed = false;
  return {
    analyser,
    sampleRate: context.sampleRate,
    applyEq: (settings) => {
      if (disposed) return;
      const now = context.currentTime;
      const gains = effectiveGains(settings);
      filters.forEach((filter, i) => {
        smooth(filter.gain, gains.bands[i] ?? 0, now);
      });
      smooth(preamp.gain, dbToLinear(gains.preampDb), now);
    },
    setMasterGain: (linear) => {
      if (disposed) return;
      const safe = Number.isFinite(linear) ? Math.min(MASTER_GAIN_MAX, Math.max(0, linear)) : 0;
      smooth(master.gain, safe, context.currentTime);
    },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      for (const node of chain) {
        node.disconnect();
      }
    },
  };
}
