import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDomAudioEngine } from './audio-engine';
import { FakeAudioContext, FakeGain, asContext } from './fake-audio-context.test.support';

function element(): HTMLAudioElement {
  const el = document.querySelector<HTMLAudioElement>('audio[data-part="audio-source"]');
  if (el === null) throw new Error('no audio element');
  return el;
}

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined);
});
afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('engine with audio processing', () => {
  it('builds the graph on the first play gesture and then plays', async () => {
    const ctx = new FakeAudioContext();
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    const engine = createDomAudioEngine(document, () => asContext(ctx));
    expect(ctx.nodes).toHaveLength(0);
    await engine.play();
    expect(ctx.resumeCalls).toBe(1);
    expect(engine.processing.isGraphActive()).toBe(true);
    expect(play).toHaveBeenCalledTimes(1);
    await engine.play();
    expect(ctx.sources).toHaveLength(1);
    engine.dispose();
  });

  it('routes volume and mute to the master gain once the graph exists', async () => {
    const ctx = new FakeAudioContext();
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    const engine = createDomAudioEngine(document, () => asContext(ctx));
    engine.setVolume(0.4);
    expect(element().volume).toBeCloseTo(0.4);
    await engine.play();
    expect(element().volume).toBe(1);
    expect(element().muted).toBe(false);
    const master = ctx.nodes.filter((n): n is FakeGain => n instanceof FakeGain)[1]!;
    expect(master.gain.value).toBeCloseTo(0.4);
    engine.setMuted(true);
    engine.setVolume(0.7);
    expect(master.gain.targets.map((t) => t.value)).toEqual([0.4, 0, 0]);
    engine.setMuted(false);
    expect(master.gain.targets.at(-1)?.value).toBeCloseTo(0.7);
    engine.dispose();
  });

  it('still plays through the element when Web Audio is unavailable', async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    const engine = createDomAudioEngine(document, () => {
      throw new Error('unavailable');
    });
    engine.setVolume(0.25);
    engine.setMuted(true);
    await engine.play();
    expect(play).toHaveBeenCalledTimes(1);
    expect(element().volume).toBeCloseTo(0.25);
    expect(element().muted).toBe(true);
    engine.dispose();
  });

  it('does not touch the context when disposed before play', async () => {
    const ctx = new FakeAudioContext();
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    const engine = createDomAudioEngine(document, () => asContext(ctx));
    engine.dispose();
    await engine.play();
    expect(ctx.nodes).toHaveLength(0);
    expect(play).not.toHaveBeenCalled();
  });

  it('disposes the graph and closes the context on dispose and on pagehide', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    const a = new FakeAudioContext();
    const engineA = createDomAudioEngine(document, () => asContext(a));
    await engineA.play();
    engineA.dispose();
    engineA.dispose();
    expect(a.closeCalls).toBe(1);
    expect(a.nodes.every((n) => n.disconnectCalls === 1)).toBe(true);
    expect(a.listenerCount).toBe(0);

    const b = new FakeAudioContext();
    const engineB = createDomAudioEngine(document, () => asContext(b));
    await engineB.play();
    window.dispatchEvent(new Event('pagehide'));
    expect(b.closeCalls).toBe(1);
    expect(document.querySelector('audio')).toBeNull();
    engineB.dispose();
    expect(b.closeCalls).toBe(1);
  });
});
