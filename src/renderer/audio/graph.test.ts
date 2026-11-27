import { describe, expect, it } from 'vitest';
import {
  DEFAULT_EQ_SETTINGS,
  EQ_BANDS,
  EQ_PRESETS,
  applyPreset,
  setBypass,
  setPreamp,
} from '@shared/audio/eq';
import { createAudioGraph } from './graph';
import {
  FakeAnalyser,
  FakeAudioContext,
  FakeBiquad,
  FakeGain,
  asContext,
} from './fake-audio-context.test.support';

function build(initial = DEFAULT_EQ_SETTINGS) {
  const ctx = new FakeAudioContext();
  const graph = createAudioGraph(asContext(ctx), document.createElement('audio'), initial, 1);
  return { ctx, graph };
}

describe('createAudioGraph', () => {
  it('connects source -> 10 biquads -> preamp -> master -> analyser -> destination', () => {
    const { ctx } = build();
    expect(ctx.chainKinds()).toEqual([
      'source',
      ...new Array<string>(10).fill('biquad'),
      'gain',
      'gain',
      'analyser',
      'destination',
    ]);
  });

  it('creates band filters with the documented types, frequencies and zero gain', () => {
    const { ctx } = build();
    const filters = ctx.nodes.filter((n): n is FakeBiquad => n instanceof FakeBiquad);
    expect(filters.map((f) => f.type)).toEqual(EQ_BANDS.map((b) => b.type));
    expect(filters.map((f) => f.frequency.value)).toEqual(EQ_BANDS.map((b) => b.frequencyHz));
    expect(filters.every((f) => f.gain.value === 0)).toBe(true);
  });

  it('configures the analyser', () => {
    const { ctx } = build();
    const analyser = ctx.nodes.find((n): n is FakeAnalyser => n instanceof FakeAnalyser);
    expect(analyser?.fftSize).toBe(2048);
    expect(analyser?.smoothingTimeConstant).toBe(0.8);
  });

  it('applies initial settings directly, including bypass', () => {
    const rock = setPreamp(applyPreset(DEFAULT_EQ_SETTINGS, 'Rock'), 6);
    const { ctx } = build(rock);
    const filters = ctx.nodes.filter((n): n is FakeBiquad => n instanceof FakeBiquad);
    expect(filters.map((f) => f.gain.value)).toEqual([...EQ_PRESETS.Rock]);
    const bypassed = build(setBypass(rock, true));
    const zero = bypassed.ctx.nodes.filter((n): n is FakeBiquad => n instanceof FakeBiquad);
    expect(zero.every((f) => f.gain.value === 0)).toBe(true);
  });

  it('changes parameters with smoothing and never rewires the graph', () => {
    const { ctx, graph } = build();
    const before = ctx.chainKinds();
    graph.applyEq(applyPreset(DEFAULT_EQ_SETTINGS, 'Bass Boost'));
    graph.applyEq(setBypass(applyPreset(DEFAULT_EQ_SETTINGS, 'Bass Boost'), true));
    expect(ctx.chainKinds()).toEqual(before);
    const first = ctx.nodes.find((n): n is FakeBiquad => n instanceof FakeBiquad)!;
    expect(first.gain.targets.map((t) => t.value)).toEqual([8, 0]);
    expect(first.gain.targets[0]?.tau).toBeGreaterThan(0);
    const gains = ctx.nodes.filter((n): n is FakeGain => n instanceof FakeGain);
    expect(gains[0]?.gain.targets).toHaveLength(2);
  });

  it('smooths and clamps master gain, treating NaN as silence', () => {
    const { ctx, graph } = build();
    const master = ctx.nodes.filter((n): n is FakeGain => n instanceof FakeGain)[1]!;
    graph.setMasterGain(0.5);
    graph.setMasterGain(5);
    graph.setMasterGain(-1);
    graph.setMasterGain(Number.NaN);
    expect(master.gain.targets.map((t) => t.value)).toEqual([0.5, 1, 0, 0]);
  });

  it('dispose disconnects every node once and later calls do nothing', () => {
    const { ctx, graph } = build();
    graph.dispose();
    graph.dispose();
    graph.applyEq(DEFAULT_EQ_SETTINGS);
    graph.setMasterGain(0.2);
    expect(ctx.nodes.every((n) => n.disconnectCalls === 1)).toBe(true);
    expect(ctx.nodes.every((n) => n.connections.length === 0)).toBe(true);
    const gains = ctx.nodes.filter((n): n is FakeGain => n instanceof FakeGain);
    expect(gains.every((g) => g.gain.targets.length === 0)).toBe(true);
  });
});
