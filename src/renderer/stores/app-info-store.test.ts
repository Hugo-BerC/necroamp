import { describe, expect, it } from 'vitest';
import { createAppInfoStore, type AppInfoClient, type AppInfoClientResult } from './app-info-store';

const INFO = { name: 'NecroAmp', version: '1.2.3', platform: 'linux' } as const;

function clientReturning(result: AppInfoClientResult): AppInfoClient & { calls: number } {
  const client = {
    calls: 0,
    getAppInfo: () => {
      client.calls += 1;
      return Promise.resolve(result);
    },
  };
  return client;
}

describe('createAppInfoStore', () => {
  it('starts idle', () => {
    const state = createAppInfoStore(clientReturning({ ok: true, data: INFO })).getState();
    expect(state.status).toBe('idle');
    expect(state.data).toBeUndefined();
  });

  it('is loading while the client call is pending, then loaded', async () => {
    let resolve: (value: AppInfoClientResult) => void = () => undefined;
    const store = createAppInfoStore({
      getAppInfo: () => new Promise<AppInfoClientResult>((r) => (resolve = r)),
    });
    const pending = store.getState().load();
    expect(store.getState().status).toBe('loading');
    resolve({ ok: true, data: INFO });
    await pending;
    expect(store.getState()).toMatchObject({ status: 'loaded', data: INFO });
  });

  it('enters unavailable when the bridge is missing', async () => {
    const store = createAppInfoStore(clientReturning({ ok: false, reason: 'unavailable' }));
    await store.getState().load();
    expect(store.getState()).toMatchObject({ status: 'unavailable', failure: 'unavailable' });
  });

  it.each(['rejected', 'invalid-response', 'ipc-error'] as const)(
    'enters failed for %s',
    async (reason) => {
      const store = createAppInfoStore(clientReturning({ ok: false, reason }));
      await store.getState().load();
      expect(store.getState()).toMatchObject({
        status: 'failed',
        failure: reason,
        data: undefined,
      });
    },
  );

  it('ignores a second load while one is in flight', async () => {
    const client = clientReturning({ ok: true, data: INFO });
    const store = createAppInfoStore(client);
    await Promise.all([store.getState().load(), store.getState().load()]);
    expect(client.calls).toBe(1);
  });

  it('keeps instances independent', async () => {
    const a = createAppInfoStore(clientReturning({ ok: true, data: INFO }));
    const b = createAppInfoStore(clientReturning({ ok: false, reason: 'rejected' }));
    await a.getState().load();
    expect(b.getState().status).toBe('idle');
  });
});
