import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_EQ_SETTINGS, EQ_PRESETS, type EqSettings } from '@shared/audio/eq';
import { createEqStore } from './eq-store';

function setup(load: () => Promise<unknown> = () => Promise.resolve(null)) {
  const setEq = vi.fn<(settings: EqSettings) => void>();
  const save = vi.fn((_settings: EqSettings) => Promise.resolve());
  const store = createEqStore({ setEq }, { load, save });
  return { store, setEq, save };
}

describe('eq store', () => {
  it('pushes the initial flat settings to the engine', () => {
    const { setEq } = setup();
    expect(setEq).toHaveBeenCalledOnce();
    expect(setEq).toHaveBeenCalledWith(DEFAULT_EQ_SETTINGS);
  });

  it('edits one band, clamps it and marks the preset Custom', () => {
    const { store, setEq, save } = setup();
    store.getState().setBand(3, 40);
    const { settings } = store.getState();
    expect(settings.bands[3]).toBe(12);
    expect(settings.preset).toBe('Custom');
    expect(setEq).toHaveBeenLastCalledWith(settings);
    expect(save).toHaveBeenLastCalledWith(settings);
  });

  it('ignores an out-of-range band index', () => {
    const { store, setEq } = setup();
    store.getState().setBand(10, 3);
    expect(setEq).toHaveBeenCalledOnce();
  });

  it('applies a preset and ignores unknown names', () => {
    const { store, setEq } = setup();
    store.getState().applyPreset('Rock');
    expect(store.getState().settings.bands).toEqual(EQ_PRESETS.Rock);
    expect(store.getState().settings.preset).toBe('Rock');
    store.getState().applyPreset('Nope');
    expect(store.getState().settings.preset).toBe('Rock');
    expect(setEq).toHaveBeenCalledTimes(2);
  });

  it('sets the preamp without changing the preset and clamps it', () => {
    const { store } = setup();
    store.getState().applyPreset('Pop');
    store.getState().setPreamp(-99);
    expect(store.getState().settings.preampDb).toBe(-12);
    expect(store.getState().settings.preset).toBe('Pop');
  });

  it('keeps stored bands on bypass', () => {
    const { store, setEq } = setup();
    store.getState().applyPreset('Rock');
    store.getState().setBypass(true);
    expect(store.getState().settings.bypass).toBe(true);
    expect(store.getState().settings.bands).toEqual(EQ_PRESETS.Rock);
    expect(setEq).toHaveBeenLastCalledWith(store.getState().settings);
  });

  it('does not notify when nothing changed', () => {
    const { store, setEq } = setup();
    store.getState().setBypass(false);
    store.getState().applyPreset('Flat');
    expect(setEq).toHaveBeenCalledOnce();
  });

  it('hydrates sanitized settings and pushes them to the engine', async () => {
    const { store, setEq } = setup(() =>
      Promise.resolve({ bands: [99, 0, 0, 0, 0, 0, 0, 0, 0, 0], preampDb: 3, bypass: true }),
    );
    await store.getState().hydrate();
    expect(store.getState().settings.bands[0]).toBe(12);
    expect(store.getState().settings.preampDb).toBe(3);
    expect(setEq).toHaveBeenLastCalledWith(store.getState().settings);
  });

  it('keeps current settings when loading fails', async () => {
    const { store } = setup(() => Promise.reject(new Error('boom')));
    await store.getState().hydrate();
    expect(store.getState().settings).toEqual(DEFAULT_EQ_SETTINGS);
  });

  it('survives a failing save and works without persistence', async () => {
    const setEq = vi.fn();
    const failing = createEqStore(
      { setEq },
      { load: () => Promise.resolve(null), save: () => Promise.reject(new Error('disk')) },
    );
    failing.getState().setPreamp(2);
    const plain = createEqStore({ setEq });
    plain.getState().setPreamp(2);
    await plain.getState().hydrate();
    expect(plain.getState().settings.preampDb).toBe(2);
    await Promise.resolve();
  });
});
