import { errorNameOf, type Logger } from '../logging/logger';

/**
 * Crash and failure policy (design section 6, R7.4, R7.5). No crash-reporting service is started.
 * Only error names and numeric codes are logged, never messages, stacks or paths (R15.3).
 */
export interface ProcessLike {
  on(
    event: 'uncaughtException' | 'unhandledRejection',
    listener: (value: unknown) => void,
  ): unknown;
}

export interface ExitableApp {
  exit(code: number): void;
  quit(): void;
}

export function installProcessCrashHandlers(
  proc: ProcessLike,
  app: ExitableApp,
  log: Logger,
): void {
  proc.on('uncaughtException', (error) => {
    // Continuing after an uncaught exception is unsafe (Node documentation), so exit.
    log.error('process.uncaught_exception', { errorName: errorNameOf(error) });
    app.exit(1);
  });
  proc.on('unhandledRejection', (reason) => {
    log.error('process.unhandled_rejection', { errorName: errorNameOf(reason) });
  });
}

export interface RenderGoneDetails {
  readonly reason: string;
  readonly exitCode: number;
}

export interface CrashableContents {
  onRenderProcessGone(listener: (details: RenderGoneDetails) => void): void;
  reload(): void;
}

/** First crash reloads once. A second crash quits on every platform (design section 6). */
export function attachRendererCrashHandler(
  contents: CrashableContents,
  app: Pick<ExitableApp, 'quit'>,
  log: Logger,
): void {
  let crashes = 0;
  contents.onRenderProcessGone((details) => {
    crashes += 1;
    log.error('renderer.process_gone', { reason: details.reason, exitCode: details.exitCode });
    if (crashes === 1) {
      contents.reload();
    } else {
      app.quit();
    }
  });
}
