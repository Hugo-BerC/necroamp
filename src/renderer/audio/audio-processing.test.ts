import { afterEach, describe, expect, it } from 'vitest';
import { applyPreset, DEFAULT_EQ_SETTINGS } from '@shared/audio/eq';
import { createAudioProcessing, type AudioContextStatus } from './audio-processing';
import {
  FakeAnalyser,
  FakeAudioContext,
  FakeBiquad,
  asContext,
} from './fake-audio-context.test.support';

afterEach(() => {
  document.body.innerHTML = '';
});

function setup() {
  const ctx = new FakeAudioContext();
  let created = 0;
  const element = document.createElement('audio');
  const processing = createAudioProcessing({
    element,
    createContext: () => {
      created += 1;
      return asContext(ctx);
    },
  });
  return { ctx, processing, element, created: () => created };
}

describe('createAudioProcessing', () => {
  it('stays inert until ensureReady and reports no data', () => {
    const { processing, ctx } = setup();
    expect(processing.isGraphActive()).toBe(false);
    expect(processing.getContextStatus()).toBe('none');
    expect(processing.getFrequencyData()).toBeNull();
    expect(processing.getWaveformData()).toBeNull();
    expect(processing.getSampleRate()).toBeNull();
    expect(processing.setMasterGain(0.5)).toBe(false);
    expect(ctx.nodes).toHaveLength(0);
  });

  it('builds one context and one graph and resumes it, even with concurrent calls', async () => {
    const { processing, ctx, created } = setup();
    const [a, b] = await Promise.all([processing.ensureReady(), processing.ensureReady()]);
    expect(a && b).toBe(true);
    await processing.ensureReady();
    expect(created()).toBe(1);
    expect(ctx.sources).toHaveLength(1);
    expect(ctx.resumeCalls).toBe(1);
    expect(processing.getContextStatus()).toBe('running');
    expect(processing.getSampleRate()).toBe(48000);
  });

  it('applies settings made before and after the graph exists', async () => {
    const { processing, ctx } = setup();
    processing.setEq(applyPreset(DEFAULT_EQ_SETTINGS, 'Rock'));
    await processing.ensureReady();
    const filters = ctx.nodes.filter((n): n is FakeBiquad => n instanceof FakeBiquad);
    expect(filters[0]?.gain.value).toBe(5);
    processing.setEq(applyPreset(DEFAULT_EQ_SETTINGS, 'Pop'));
    expect(filters[0]?.gain.targets.at(-1)?.value).toBe(-1);
    expect(processing.getEq().preset).toBe('Pop');
  });

  it('sanitizes hostile settings', () => {
    const { processing } = setup();
    processing.setEq({ bands: [99], preampDb: Number.NaN } as never);
    expect(processing.getEq().bands[0]).toBe(12);
    expect(processing.getEq().preampDb).toBe(0);
  });

  it('uses the master gain once the graph exists', async () => {
    const { processing } = setup();
    processing.setMasterGain(0.3);
    await processing.ensureReady();
    expect(processing.setMasterGain(0.6)).toBe(true);
  });

  it('reads analyser data into reused buffers', async () => {
    const { processing, ctx } = setup();
    await processing.ensureReady();
    const analyser = ctx.nodes.find((n): n is FakeAnalyser => n instanceof FakeAnalyser)!;
    analyser.frequencyFill = 200;
    const f1 = processing.getFrequencyData();
    const f2 = processing.getFrequencyData();
    const w1 = processing.getWaveformData();
    expect(f1).toBe(f2);
    expect(f1).toHaveLength(1024);
    expect(f1?.[0]).toBe(200);
    expect(w1).toHaveLength(2048);
    expect(w1?.[0]).toBe(128);
  });

  it('mirrors context state changes and unsubscribes', async () => {
    const { processing } = setup();
    const seen: AudioContextStatus[] = [];
    const off = processing.subscribeContextStatus((s) => seen.push(s));
    await processing.ensureReady();
    expect(seen).toContain('running');
    off();
    const count = seen.length;
    processing.dispose();
    expect(seen).toHaveLength(count);
  });

  it('keeps the graph when resume fails and reports false', async () => {
    const { processing, ctx } = setup();
    ctx.resumeShouldFail = true;
    expect(await processing.ensureReady()).toBe(false);
    expect(processing.isGraphActive()).toBe(true);
    ctx.resumeShouldFail = false;
    expect(await processing.ensureReady()).toBe(true);
    expect(ctx.sources).toHaveLength(1);
  });

  it('falls back cleanly when Web Audio is unavailable', async () => {
    const processing = createAudioProcessing({
      element: document.createElement('audio'),
      createContext: () => {
        throw new Error('no audio');
      },
    });
    expect(await processing.ensureReady()).toBe(false);
    expect(await processing.ensureReady()).toBe(false);
    expect(processing.isGraphActive()).toBe(false);
    expect(processing.getContextStatus()).toBe('none');
  });

  it('resumes a suspended context when the document becomes visible while playing', async () => {
    const { processing, ctx, element } = setup();
    Object.defineProperty(element, 'paused', { value: false });
    await processing.ensureReady();
    ctx.state = 'suspended';
    document.dispatchEvent(new Event('visibilitychange'));
    expect(ctx.resumeCalls).toBe(2);
    processing.dispose();
  });

  it('dispose disconnects nodes, closes the context, drops listeners and is idempotent', async () => {
    const { processing, ctx } = setup();
    await processing.ensureReady();
    processing.dispose();
    processing.dispose();
    expect(ctx.nodes.every((n) => n.disconnectCalls === 1)).toBe(true);
    expect(ctx.closeCalls).toBe(1);
    expect(ctx.state).toBe('closed');
    expect(ctx.listenerCount).toBe(0);
    expect(processing.isGraphActive()).toBe(false);
    expect(await processing.ensureReady()).toBe(false);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(ctx.resumeCalls).toBe(1);
  });
});
