import { describe, expect, it, vi } from 'vitest';
import { IPC_CHANNELS, IPC_EVENT_CHANNELS } from '@shared/ipc';
import { createNecroampApi, type SubscribeChannel } from './create-necroamp-api';

function harness() {
  let push: ((payload: unknown) => void) | undefined;
  const unsubscribe = vi.fn();
  const subscribe = vi.fn<SubscribeChannel>((_channel, listener) => {
    push = listener;
    return unsubscribe;
  });
  const invoke = vi.fn(() => Promise.resolve({ ok: true, data: { applied: true } }));
  const api = createNecroampApi(invoke, subscribe);
  return { api, invoke, subscribe, unsubscribe, push: (p: unknown) => push?.(p) };
}

describe('menu bridge', () => {
  it('subscribes only to the menu command channel and delivers validated commands', () => {
    const { api, subscribe, push } = harness();
    const listener = vi.fn();
    api.menu.onCommand(listener);
    expect(subscribe).toHaveBeenCalledWith(IPC_EVENT_CHANNELS.menuCommand, expect.any(Function));
    push({ command: 'open-files' });
    expect(listener).toHaveBeenCalledWith({ command: 'open-files' });
  });

  it.each([null, 'open-files', {}, { command: 'rm' }, { command: 'open-files', path: 'C:\\x' }])(
    'drops invalid payload %j',
    (payload) => {
      const { api, push } = harness();
      const listener = vi.fn();
      api.menu.onCommand(listener);
      push(payload);
      expect(listener).not.toHaveBeenCalled();
    },
  );

  it('unsubscribes once and stops delivering', () => {
    const { api, unsubscribe, push } = harness();
    const listener = vi.fn();
    const off = api.menu.onCommand(listener);
    off();
    off();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    push({ command: 'clear-playlist' });
    expect(listener).not.toHaveBeenCalled();
  });

  it('survives a throwing listener and a non-function argument', () => {
    const { api, push } = harness();
    api.menu.onCommand(() => {
      throw new Error('boom');
    });
    expect(() => push({ command: 'open-folder' })).not.toThrow();
    expect(() => (api.menu.onCommand as (l: unknown) => () => void)(42)()).not.toThrow();
  });

  it('reports playlist state with a rebuilt payload and rejects bad input', async () => {
    const { api, invoke } = harness();
    await api.menu.reportPlaylistState({ hasTracks: true, extra: 1 } as never);
    expect(invoke).not.toHaveBeenCalled();
    expect(await api.menu.reportPlaylistState({ hasTracks: 'x' } as never)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_PAYLOAD' },
    });
    expect(await api.menu.reportPlaylistState({ hasTracks: true })).toEqual({
      ok: true,
      data: { applied: true },
    });
    expect(invoke).toHaveBeenCalledWith(IPC_CHANNELS.menuReportState, { hasTracks: true });
  });

  it('openFolder takes no arguments and parses the response', async () => {
    const invoke = vi.fn(() =>
      Promise.resolve({ ok: true, data: { tracks: [], canceled: false, truncated: false } }),
    );
    const api = createNecroampApi(invoke);
    expect(await api.library.openFolder()).toEqual({
      ok: true,
      data: { tracks: [], canceled: false, truncated: false },
    });
    expect(invoke).toHaveBeenCalledWith(IPC_CHANNELS.libraryOpenFolder);
    expect(
      await (api.library.openFolder as (x: unknown) => Promise<unknown>)('/etc'),
    ).toMatchObject({
      error: { code: 'INVALID_PAYLOAD' },
    });
    expect(
      await createNecroampApi(() => Promise.resolve({ bad: 1 })).library.openFolder(),
    ).toMatchObject({
      error: { code: 'INTERNAL' },
    });
  });
});
