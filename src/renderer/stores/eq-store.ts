import { createStore, type StoreApi } from 'zustand';
import {
  DEFAULT_EQ_SETTINGS,
  applyPreset as applyPresetPure,
  editBand,
  sanitizeEqSettings,
  setBypass as setBypassPure,
  setPreamp as setPreampPure,
  type EqSettings,
} from '@shared/audio/eq';

/** What the store needs from the audio engine. `AudioProcessing` satisfies it structurally. */
export interface EqPort {
  readonly setEq: (settings: EqSettings) => void;
}

/** Optional persistence. Not wired until the settings IPC contract exists (see journal). */
export interface EqPersistence {
  readonly load: () => Promise<unknown>;
  readonly save: (settings: EqSettings) => Promise<void>;
}

export interface EqState {
  readonly settings: EqSettings;
  readonly setBand: (index: number, gainDb: number) => void;
  readonly setPreamp: (preampDb: number) => void;
  readonly setBypass: (bypass: boolean) => void;
  readonly applyPreset: (name: string) => void;
  /** Loads stored settings (sanitized). Failures keep the current settings. */
  readonly hydrate: () => Promise<void>;
}

export type EqStore = StoreApi<EqState>;

function sameSettings(a: EqSettings, b: EqSettings): boolean {
  return (
    a.preampDb === b.preampDb &&
    a.bypass === b.bypass &&
    a.preset === b.preset &&
    a.bands.length === b.bands.length &&
    a.bands.every((gain, i) => gain === b.bands[i])
  );
}

/**
 * Equalizer settings store. Pure edits come from `@shared/audio/eq`; every change is pushed
 * to the engine port. The store never reads playback state.
 */
export function createEqStore(port: EqPort, persistence?: EqPersistence): EqStore {
  const store = createStore<EqState>()((set, get) => {
    const commit = (next: EqSettings): void => {
      if (sameSettings(next, get().settings)) {
        return;
      }
      set({ settings: next });
      port.setEq(next);
      void persistence?.save(next).catch(() => undefined);
    };
    return {
      settings: DEFAULT_EQ_SETTINGS,
      setBand: (index, gainDb) => {
        commit(editBand(get().settings, index, gainDb));
      },
      setPreamp: (preampDb) => {
        commit(setPreampPure(get().settings, preampDb));
      },
      setBypass: (bypass) => {
        commit(setBypassPure(get().settings, bypass));
      },
      applyPreset: (name) => {
        commit(applyPresetPure(get().settings, name));
      },
      hydrate: async () => {
        if (persistence === undefined) {
          return;
        }
        try {
          const stored = sanitizeEqSettings(await persistence.load());
          set({ settings: stored });
          port.setEq(stored);
        } catch {
          // Keep the current settings.
        }
      },
    };
  });
  port.setEq(store.getState().settings);
  return store;
}
