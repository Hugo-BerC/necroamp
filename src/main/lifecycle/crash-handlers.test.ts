import { describe, expect, it, vi } from 'vitest';
import type { Logger } from '../logging/logger';
import {
  attachRendererCrashHandler,
  installProcessCrashHandlers,
  type RenderGoneDetails,
} from './crash-handlers';

const silentLog = (): Logger => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() });

function fakeProcess() {
  const handlers = new Map<string, (value: unknown) => void>();
  return {
    handlers,
    proc: {
      on: (
        event: 'uncaughtException' | 'unhandledRejection',
        listener: (value: unknown) => void,
      ) => {
        handlers.set(event, listener);
      },
    },
  };
}

describe('installProcessCrashHandlers', () => {
  it('logs the error name only and exits with code 1 on uncaughtException', () => {
    const { proc, handlers } = fakeProcess();
    const app = { exit: vi.fn(), quit: vi.fn() };
    const log = silentLog();
    installProcessCrashHandlers(proc, app, log);
    handlers.get('uncaughtException')?.(new RangeError('C:\\Users\\me\\secret'));
    expect(log.error).toHaveBeenCalledWith('process.uncaught_exception', {
      errorName: 'RangeError',
    });
    expect(JSON.stringify((log.error as ReturnType<typeof vi.fn>).mock.calls)).not.toContain(
      'secret',
    );
    expect(app.exit).toHaveBeenCalledWith(1);
  });

  it('logs the name only and does not exit on unhandledRejection', () => {
    const { proc, handlers } = fakeProcess();
    const app = { exit: vi.fn(), quit: vi.fn() };
    const log = silentLog();
    installProcessCrashHandlers(proc, app, log);
    handlers.get('unhandledRejection')?.('plain string reason with /secret/path');
    expect(log.error).toHaveBeenCalledWith('process.unhandled_rejection', {
      errorName: 'UnknownError',
    });
    expect(app.exit).not.toHaveBeenCalled();
    expect(app.quit).not.toHaveBeenCalled();
  });
});

describe('attachRendererCrashHandler', () => {
  function setup() {
    let listener: ((d: RenderGoneDetails) => void) | undefined;
    const contents = {
      onRenderProcessGone: (l: (d: RenderGoneDetails) => void) => {
        listener = l;
      },
      reload: vi.fn(),
    };
    const app = { quit: vi.fn() };
    const log = silentLog();
    attachRendererCrashHandler(contents, app, log);
    return { contents, app, log, crash: (d: RenderGoneDetails) => listener?.(d) };
  }

  it('reloads once on the first crash', () => {
    const { contents, app, crash, log } = setup();
    crash({ reason: 'crashed', exitCode: 11 });
    expect(contents.reload).toHaveBeenCalledTimes(1);
    expect(app.quit).not.toHaveBeenCalled();
    expect(log.error).toHaveBeenCalledWith('renderer.process_gone', {
      reason: 'crashed',
      exitCode: 11,
    });
  });

  it('quits on the second crash and does not reload again', () => {
    const { contents, app, crash } = setup();
    crash({ reason: 'crashed', exitCode: 11 });
    crash({ reason: 'oom', exitCode: 1 });
    expect(contents.reload).toHaveBeenCalledTimes(1);
    expect(app.quit).toHaveBeenCalledTimes(1);
  });

  it('counts crashes per attached contents', () => {
    const first = setup();
    const second = setup();
    first.crash({ reason: 'crashed', exitCode: 1 });
    second.crash({ reason: 'crashed', exitCode: 1 });
    expect(first.app.quit).not.toHaveBeenCalled();
    expect(second.app.quit).not.toHaveBeenCalled();
  });
});
