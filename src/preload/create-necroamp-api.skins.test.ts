import { describe, expect, it, vi } from 'vitest';
import { IPC_CHANNELS, IPC_EVENT_CHANNELS, createIpcError } from '@shared/ipc';
import type { IpcEventChannel } from '@shared/ipc';
import { createNecroampApi, type SubscribeChannel } from './create-necroamp-api';

const INTERNAL = { ok: false, error: createIpcError('INTERNAL') };
const INVALID = { ok: false, error: createIpcError('INVALID_PAYLOAD') };

describe('skins bridge', () => {
  it('exposes exactly list, getActive, setActive and onChanged, frozen', () => {
    const api = createNecroampApi(() => Promise.resolve(undefined));
    expect(Object.keys(api.skins)).toEqual(['list', 'getActive', 'setActive', 'onChanged']);
    expect(Object.isFrozen(api.skins)).toBe(true);
  });

  it('list and getActive invoke their channels with no arguments and reject extras', async () => {
    const invoke = vi.fn(() => Promise.resolve({ unexpected: true }));
    const api = createNecroampApi(invoke);
    expect(await api.skins.list()).toEqual(INTERNAL);
    expect(invoke).toHaveBeenCalledWith(IPC_CHANNELS.skinsList);
    expect(await api.skins.getActive()).toEqual(INTERNAL);
    expect(invoke).toHaveBeenLastCalledWith(IPC_CHANNELS.skinsGetActive);
    invoke.mockClear();
    expect(await (api.skins.list as (...a: unknown[]) => Promise<unknown>)('x')).toEqual(INVALID);
    expect(invoke).not.toHaveBeenCalled();
  });

  it('setActive forwards only { skinId } and drops extra properties', async () => {
    const invoke = vi.fn(() => Promise.resolve(undefined));
    const api = createNecroampApi(invoke);
    await (api.skins.setActive as (r: unknown) => Promise<unknown>)({ skinId: 'x' });
    expect(invoke).toHaveBeenCalledWith(IPC_CHANNELS.skinsSetActive, { skinId: 'x' });
  });

  it.each([
    [undefined],
    [{}],
    [{ skinId: 1 }],
    [{ skinId: '../x' }],
    [{ skinId: 'x', path: 'C:/' }],
    ['x'],
  ])('setActive rejects %j without invoking', async (arg) => {
    const invoke = vi.fn();
    const api = createNecroampApi(invoke);
    expect(await (api.skins.setActive as (r: unknown) => Promise<unknown>)(arg)).toEqual(INVALID);
    expect(invoke).not.toHaveBeenCalled();
  });

  it('never rejects with transport error text', async () => {
    const api = createNecroampApi(() => Promise.reject(new Error('C:\\secret')));
    const result = await api.skins.list();
    expect(result).toEqual(INTERNAL);
    expect(JSON.stringify(result)).not.toContain('secret');
  });

  it('passes a valid response through', async () => {
    const response = {
      ok: true,
      data: { applied: false, reason: 'unknown-skin' },
    };
    const api = createNecroampApi(() => Promise.resolve(response));
    expect(await api.skins.setActive({ skinId: 'ghost' })).toEqual(response);
  });
});

function subscriber() {
  const listeners = new Map<IpcEventChannel, (payload: unknown) => void>();
  const unsubscribe = vi.fn();
  const subscribe: SubscribeChannel = (channel, listener) => {
    listeners.set(channel, listener);
    return unsubscribe;
  };
  return { subscribe, listeners, unsubscribe };
}

const STATE = { maximized: false, fullScreen: false, focused: true, platform: 'win32' };

describe('window bridge', () => {
  it('exposes exactly the four actions and one subscription, frozen', () => {
    const api = createNecroampApi(() => Promise.resolve(undefined));
    expect(Object.keys(api.window)).toEqual([
      'minimize',
      'toggleMaximize',
      'close',
      'getState',
      'onStateChanged',
    ]);
    expect(Object.isFrozen(api.window)).toBe(true);
  });

  it.each([
    ['minimize', IPC_CHANNELS.windowMinimize],
    ['toggleMaximize', IPC_CHANNELS.windowToggleMaximize],
    ['close', IPC_CHANNELS.windowClose],
    ['getState', IPC_CHANNELS.windowGetState],
  ] as const)('%s invokes only its channel without arguments', async (method, channel) => {
    const invoke = vi.fn(() => Promise.resolve({ ok: true, data: { applied: true } }));
    const api = createNecroampApi(invoke);
    await api.window[method]();
    expect(invoke).toHaveBeenCalledTimes(1);
    expect(invoke).toHaveBeenCalledWith(channel);
  });

  it.each(['minimize', 'toggleMaximize', 'close', 'getState'] as const)(
    '%s rejects arguments, so no size, position or id can be sent',
    async (method) => {
      const invoke = vi.fn();
      const api = createNecroampApi(invoke);
      const call = api.window[method] as (...a: unknown[]) => Promise<unknown>;
      expect(await call({ width: 1 })).toEqual(INVALID);
      expect(await call(1, 2)).toEqual(INVALID);
      expect(invoke).not.toHaveBeenCalled();
    },
  );

  it('returns the parsed window state', async () => {
    const api = createNecroampApi(() => Promise.resolve({ ok: true, data: STATE }));
    expect(await api.window.getState()).toEqual({ ok: true, data: STATE });
  });
});

describe('push subscriptions', () => {
  it('skins.onChanged validates payloads and drops invalid ones', () => {
    const { subscribe, listeners } = subscriber();
    const api = createNecroampApi(() => Promise.resolve(undefined), subscribe);
    const listener = vi.fn();
    api.skins.onChanged(listener);
    const push = listeners.get(IPC_EVENT_CHANNELS.skinsChanged);
    push?.({ activeId: 'x' });
    push?.('nope');
    push?.(null);
    expect(listener).not.toHaveBeenCalled();
  });

  it('window.onStateChanged delivers a validated fresh object', () => {
    const { subscribe, listeners } = subscriber();
    const api = createNecroampApi(() => Promise.resolve(undefined), subscribe);
    const listener = vi.fn();
    api.window.onStateChanged(listener);
    const payload = { ...STATE };
    listeners.get(IPC_EVENT_CHANNELS.windowStateChanged)?.(payload);
    expect(listener).toHaveBeenCalledWith(STATE);
    expect(listener.mock.calls[0]?.[0]).not.toBe(payload);
    listeners.get(IPC_EVENT_CHANNELS.windowStateChanged)?.({ ...STATE, extra: 1 });
    listeners.get(IPC_EVENT_CHANNELS.windowStateChanged)?.({ ...STATE, platform: 'beos' });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('unsubscribe is idempotent and silences the listener', () => {
    const { subscribe, listeners, unsubscribe } = subscriber();
    const api = createNecroampApi(() => Promise.resolve(undefined), subscribe);
    const listener = vi.fn();
    const off = api.window.onStateChanged(listener);
    off();
    off();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    listeners.get(IPC_EVENT_CHANNELS.windowStateChanged)?.(STATE);
    expect(listener).not.toHaveBeenCalled();
  });

  it('contains a throwing listener and a throwing unsubscribe', () => {
    const { listeners } = subscriber();
    const subscribe: SubscribeChannel = (channel, listener) => {
      listeners.set(channel, listener);
      return () => {
        throw new Error('gone');
      };
    };
    const api = createNecroampApi(() => Promise.resolve(undefined), subscribe);
    const off = api.window.onStateChanged(() => {
      throw new Error('C:\\secret');
    });
    expect(() => listeners.get(IPC_EVENT_CHANNELS.windowStateChanged)?.(STATE)).not.toThrow();
    expect(() => off()).not.toThrow();
  });

  it('returns a no-op for a non-function listener and when subscribing throws', () => {
    const api = createNecroampApi(() => Promise.resolve(undefined));
    expect(() =>
      (api.skins.onChanged as (l: unknown) => () => void)('not a function')(),
    ).not.toThrow();
    const throwing = createNecroampApi(
      () => Promise.resolve(undefined),
      () => {
        throw new Error('x');
      },
    );
    expect(() => throwing.window.onStateChanged(() => undefined)()).not.toThrow();
  });
});
