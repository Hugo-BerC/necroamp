import { appInfoResponseSchema } from '@shared/ipc';
import type { AppInfoClient, AppInfoClientResult } from '@renderer/stores/app-info-store';

/**
 * The only module that reads `window.necroamp` (R4.9). The host is a parameter so tests
 * pass a fake. The bridge value is untrusted: it is narrowed from `unknown`, and every
 * response is parsed with the shared schema before use.
 */
export interface BridgeHost {
  readonly necroamp?: unknown;
}

type GetInfo = () => Promise<unknown>;

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null;
}

function readGetInfo(host: BridgeHost): GetInfo | undefined {
  const bridge = host.necroamp;
  if (!isRecord(bridge)) {
    return undefined;
  }
  const app = bridge['app'];
  if (!isRecord(app) || typeof app['getInfo'] !== 'function') {
    return undefined;
  }
  // Call through the namespace object so `this` is preserved. The result is parsed below.
  return () => Promise.resolve((app['getInfo'] as GetInfo)());
}

export function createNecroampClient(host: BridgeHost): AppInfoClient {
  return {
    getAppInfo: async (): Promise<AppInfoClientResult> => {
      const getInfo = readGetInfo(host);
      if (getInfo === undefined) {
        return { ok: false, reason: 'unavailable' };
      }
      let raw: unknown;
      try {
        raw = await getInfo();
      } catch {
        // The error object is deliberately dropped: it may carry paths or internals.
        return { ok: false, reason: 'rejected' };
      }
      const parsed = appInfoResponseSchema.safeParse(raw);
      if (!parsed.success) {
        return { ok: false, reason: 'invalid-response' };
      }
      if (!parsed.data.ok) {
        return { ok: false, reason: 'ipc-error', code: parsed.data.error.code };
      }
      return { ok: true, data: parsed.data.data };
    },
  };
}
