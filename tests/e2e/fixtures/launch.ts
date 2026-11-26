import type { ChildProcess } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  _electron as electron,
  test as base,
  type ElectronApplication,
  type Page,
} from '@playwright/test';

// T7.1: launch fixture. Every test gets its own temporary user-data directory and a bounded teardown that also runs on failure.
export const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const E2E_USER_DATA_ENV = 'NECROAMP_E2E_USER_DATA';

export interface LaunchedApp {
  readonly app: ElectronApplication;
  readonly userData: string;
  /** Captured at launch: app.process() is unusable once Playwright has disposed the app handle. */
  readonly child: ChildProcess;
  /** Lines the main process wrote to stdout and stderr (the app logger uses console). */
  readonly logs: string[];
  readonly env: NodeJS.ProcessEnv;
}

export function launchEnv(userData: string): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env, [E2E_USER_DATA_ENV]: userData };
  // The production build must never use a dev server or run as plain Node.
  delete env['ELECTRON_RENDERER_URL'];
  delete env['ELECTRON_RUN_AS_NODE'];
  return env;
}

export function makeUserData(): string {
  // path.normalize keeps the value identical to what main's override check expects on every platform.
  return path.normalize(mkdtempSync(path.join(tmpdir(), 'necroamp-e2e-')));
}

export async function launchApp(userData = makeUserData()): Promise<LaunchedApp> {
  const env = launchEnv(userData);
  // The app path is the repository root, so main finds package.json and out/renderer.
  const cleanEnv = Object.fromEntries(
    Object.entries(env).filter((entry): entry is [string, string] => entry[1] !== undefined),
  );
  const app = await electron.launch({ args: [REPO_ROOT], cwd: REPO_ROOT, env: cleanEnv });
  const logs: string[] = [];
  const collect = (chunk: Buffer | string): void => {
    for (const line of chunk.toString().split(/\r?\n/)) if (line !== '') logs.push(line);
  };
  const child = app.process();
  child.stdout?.on('data', collect);
  child.stderr?.on('data', collect);
  return { app, userData, child, logs, env };
}

function hasExited(child: ChildProcess): boolean {
  return child.exitCode !== null || child.signalCode !== null;
}

/** Closes the app within a bound and kills it if it does not exit. Safe to call twice. */
export async function shutdownApp(launched: LaunchedApp): Promise<void> {
  const { app, child } = launched;
  if (!hasExited(child)) {
    const exited = new Promise<void>((resolve) => child.once('exit', () => resolve()));
    await Promise.race([
      app.close().catch(() => undefined),
      new Promise<void>((resolve) => setTimeout(resolve, 8_000)),
    ]);
    if (!hasExited(child)) {
      child.kill('SIGKILL');
      await exited;
    }
  }
  rmSync(launched.userData, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
}

export async function firstWindow(app: ElectronApplication): Promise<Page> {
  const page = await app.firstWindow();
  await page.waitForLoadState('domcontentloaded');
  return page;
}

interface Fixtures {
  launched: LaunchedApp;
  app: ElectronApplication;
  page: Page;
}

export const test = base.extend<Fixtures>({
  // Playwright reads the fixture dependencies from the first parameter, so it must be a destructuring pattern.
  // eslint-disable-next-line no-empty-pattern
  launched: async ({}, use) => {
    const launched = await launchApp();
    try {
      await use(launched);
    } finally {
      await shutdownApp(launched);
    }
  },
  app: async ({ launched }, use) => {
    await use(launched.app);
  },
  page: async ({ app }, use) => {
    await use(await firstWindow(app));
  },
});

export { expect } from '@playwright/test';
