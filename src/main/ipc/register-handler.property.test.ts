import fc from 'fast-check';
import { describe, expect, it, vi } from 'vitest';
import {
  IPC_CHANNELS,
  IPC_ERROR_MESSAGES,
  appInfoRequestSchema,
  appInfoResponseSchema,
  type AppInfoResponse,
} from '@shared/ipc';
import type { Logger } from '../logging/logger';
import type { SenderEventLike } from '../security/sender-validation';
import { registerAppHandlers } from './app-handlers';
import { registerHandler, type IpcMainLike } from './register-handler';

type Listener = (event: SenderEventLike, ...args: unknown[]) => Promise<unknown>;

function harness(options: {
  trusted: (event: SenderEventLike) => boolean;
  handler: () => AppInfoResponse | Promise<AppInfoResponse>;
}) {
  let listener: Listener | undefined;
  const ipcMain: IpcMainLike = {
    handle: (_channel, l) => {
      listener = l;
    },
    removeHandler: () => undefined,
  };
  const logCalls: string[] = [];
  const log: Logger = {
    info: (e, f) => logCalls.push(JSON.stringify([e, f])),
    warn: (e, f) => logCalls.push(JSON.stringify([e, f])),
    error: (e, f) => logCalls.push(JSON.stringify([e, f])),
  };
  const handler = vi.fn(options.handler);
  registerHandler({
    ipcMain,
    channel: IPC_CHANNELS.appGetInfo,
    requestSchema: appInfoRequestSchema,
    responseSchema: appInfoResponseSchema,
    isTrustedSender: options.trusted,
    log,
    handler,
  });
  const invoke = (event: SenderEventLike, ...args: unknown[]) => {
    if (listener === undefined) throw new Error('not registered');
    return listener(event, ...args);
  };
  return { invoke, handler, logCalls };
}

const goodEvent: SenderEventLike = { senderFrame: { url: 'app://renderer/', parent: null } };
const goodInfo: AppInfoResponse = {
  ok: true,
  data: { name: 'NecroAmp', version: '0.0.0', platform: 'linux' },
};
const SECRET = 'C:\\Users\\victim\\secret-token-ghp_FAKE';

describe('registerHandler properties (R4)', () => {
  it('an untrusted sender never reaches the handler and gets INVALID_SENDER for any payload', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(fc.anything(), { maxLength: 4 }), async (args) => {
        const h = harness({ trusted: () => false, handler: () => goodInfo });
        const result = await h.invoke(goodEvent, ...args);
        expect(result).toEqual({
          ok: false,
          error: { code: 'INVALID_SENDER', message: IPC_ERROR_MESSAGES.INVALID_SENDER },
        });
        expect(h.handler).not.toHaveBeenCalled();
      }),
    );
  });

  it('a throwing sender check is treated as untrusted', async () => {
    const h = harness({
      trusted: () => {
        throw new Error(SECRET);
      },
      handler: () => goodInfo,
    });
    const result = await h.invoke(goodEvent);
    expect(result).toMatchObject({ ok: false, error: { code: 'INVALID_SENDER' } });
    expect(JSON.stringify(result)).not.toContain('victim');
    expect(h.handler).not.toHaveBeenCalled();
  });

  it('any non-empty argument list is INVALID_PAYLOAD and the handler is not called', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(fc.anything(), { minLength: 1, maxLength: 4 }), async (args) => {
        const h = harness({ trusted: () => true, handler: () => goodInfo });
        const result = await h.invoke(goodEvent, ...args);
        expect(result).toMatchObject({ ok: false, error: { code: 'INVALID_PAYLOAD' } });
        expect(h.handler).not.toHaveBeenCalled();
        expect(h.logCalls.join('')).not.toContain('ghp_');
      }),
    );
  });

  it('a handler that throws any value yields INTERNAL with a fixed message and no leaked text', async () => {
    await fc.assert(
      fc.asyncProperty(fc.anything(), async (thrown) => {
        const h = harness({
          trusted: () => true,
          handler: () => {
            throw thrown ?? new Error(SECRET);
          },
        });
        const result = await h.invoke(goodEvent);
        expect(result).toEqual({
          ok: false,
          error: { code: 'INTERNAL', message: IPC_ERROR_MESSAGES.INTERNAL },
        });
      }),
    );
  });

  it('a handler that returns arbitrary data (response drift) yields INTERNAL, never the data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.anything().filter((v) => !appInfoResponseSchema.safeParse(v).success),
        async (drift) => {
          const h = harness({ trusted: () => true, handler: () => drift as AppInfoResponse });
          const result = await h.invoke(goodEvent);
          expect(result).toMatchObject({ ok: false, error: { code: 'INTERNAL' } });
        },
      ),
    );
  });

  it('a valid response passes through unchanged and never rejects', async () => {
    const h = harness({ trusted: () => true, handler: () => goodInfo });
    await expect(h.invoke(goodEvent)).resolves.toEqual(goodInfo);
  });

  it('registerAppHandlers: any platform string outside the supported set yields INTERNAL', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string().filter((p) => !['win32', 'darwin', 'linux'].includes(p)),
        async (platform) => {
          let listener: Listener | undefined;
          registerAppHandlers({
            ipcMain: { handle: (_c, l) => void (listener = l), removeHandler: () => undefined },
            app: { getName: () => 'NecroAmp', getVersion: () => '1.0.0' },
            platform,
            isTrustedSender: () => true,
            log: { info: () => undefined, warn: () => undefined, error: () => undefined },
          });
          const result = await listener?.(goodEvent);
          expect(result).toMatchObject({ ok: false, error: { code: 'INTERNAL' } });
        },
      ),
    );
  });
});
