import type { BrowserWindowConstructorOptions } from 'electron';
import { describe, expect, it, vi } from 'vitest';
import type { Logger } from '../logging/logger';
import { createMainWindow, type WindowLike } from './create-main-window';
import type { LoadTarget } from './load-target';
import { buildWebPreferences } from './window-options';

const PRELOAD = '/app/out/preload/index.js';
const PRODUCTION: LoadTarget = { kind: 'production', url: 'app://renderer/index.html' };
const silentLog = (): Logger => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() });

function fakeWindowClass(loadResult: () => Promise<void> = () => Promise.resolve()) {
  const created: { options: BrowserWindowConstructorOptions; window: FakeWindow }[] = [];
  class FakeWindow implements WindowLike {
    readonly handlers = new Map<string, () => void>();
    readonly show = vi.fn();
    readonly loadURL = vi.fn((_url: string) => loadResult());
    constructor(readonly options: BrowserWindowConstructorOptions) {
      created.push({ options, window: this });
    }
    once(event: 'ready-to-show', listener: () => void): this {
      this.handlers.set(event, listener);
      return this;
    }
  }
  return { FakeWindow, created };
}

describe('createMainWindow', () => {
  it('creates exactly one window with the approved web preferences', () => {
    const { FakeWindow, created } = fakeWindowClass();
    createMainWindow({
      BrowserWindow: FakeWindow,
      preloadPath: PRELOAD,
      target: PRODUCTION,
      log: silentLog(),
    });
    expect(created).toHaveLength(1);
    expect(created[0]?.options.webPreferences).toEqual(buildWebPreferences(PRELOAD));
  });

  it('uses the same web preferences for production and development targets', () => {
    const dev: LoadTarget = {
      kind: 'development',
      url: 'http://localhost:5173/',
      devOrigin: 'http://localhost:5173',
    };
    const a = fakeWindowClass();
    const b = fakeWindowClass();
    createMainWindow({
      BrowserWindow: a.FakeWindow,
      preloadPath: PRELOAD,
      target: PRODUCTION,
      log: silentLog(),
    });
    createMainWindow({
      BrowserWindow: b.FakeWindow,
      preloadPath: PRELOAD,
      target: dev,
      log: silentLog(),
    });
    expect(a.created[0]?.options.webPreferences).toEqual(b.created[0]?.options.webPreferences);
  });

  it('starts hidden and shows on ready-to-show', () => {
    const { FakeWindow, created } = fakeWindowClass();
    createMainWindow({
      BrowserWindow: FakeWindow,
      preloadPath: PRELOAD,
      target: PRODUCTION,
      log: silentLog(),
    });
    const entry = created[0];
    expect(entry?.options.show).toBe(false);
    expect(entry?.window.show).not.toHaveBeenCalled();
    entry?.window.handlers.get('ready-to-show')?.();
    expect(entry?.window.show).toHaveBeenCalledTimes(1);
  });

  it('loads the target URL', () => {
    const { FakeWindow, created } = fakeWindowClass();
    createMainWindow({
      BrowserWindow: FakeWindow,
      preloadPath: PRELOAD,
      target: PRODUCTION,
      log: silentLog(),
    });
    expect(created[0]?.window.loadURL).toHaveBeenCalledWith('app://renderer/index.html');
  });

  it('logs a failed load by code only', async () => {
    const { FakeWindow } = fakeWindowClass(() => Promise.reject(new Error('C:\\secret\\path')));
    const log = silentLog();
    createMainWindow({ BrowserWindow: FakeWindow, preloadPath: PRELOAD, target: PRODUCTION, log });
    await Promise.resolve();
    await Promise.resolve();
    expect(log.error).toHaveBeenCalledWith('window.load_failed', { code: 'production' });
  });
});
