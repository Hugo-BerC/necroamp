import type { WebContents } from 'electron';
import { describe, expect, it, vi } from 'vitest';
import type { Logger } from '@main/logging/logger';
import {
  adaptWebContents,
  installNavigationGuards,
  type WebContentsCreatedSource,
} from '@main/window/navigation-guards';

// T6.2/T6.3: the Electron adapter around the pure navigation guard (R6.1 to R6.3), with a fake
// WebContents and a fake `app`. Covers will-navigate, will-redirect, will-frame-navigate, webview and window.open.
type Listener = (details: { url: string; preventDefault(): void }) => void;

function fakeWebContents() {
  const listeners = new Map<string, Listener[]>();
  let openHandler: (() => { action: string }) | undefined;
  const contents = {
    on: (event: string, listener: Listener) => {
      listeners.set(event, [...(listeners.get(event) ?? []), listener]);
    },
    setWindowOpenHandler: (handler: () => { action: string }) => {
      openHandler = handler;
    },
  };
  return {
    contents: contents as unknown as WebContents,
    emit: (event: string, url = 'app://renderer/index.html') => {
      const preventDefault = vi.fn();
      for (const l of listeners.get(event) ?? []) l({ url, preventDefault });
      return preventDefault.mock.calls.length > 0;
    },
    events: () => [...listeners.keys()].sort(),
    openWindow: () => openHandler?.(),
  };
}
const log = (): Logger => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() });

describe('navigation guard Electron adapter', () => {
  it('listens to every navigation event Electron offers, including sub-frames', () => {
    const fake = fakeWebContents();
    installNavigationGuards(
      { on: (_e, listener) => listener({}, fake.contents) } as WebContentsCreatedSource,
      ['app://renderer'],
      log(),
    );
    expect(fake.events()).toEqual([
      'will-attach-webview',
      'will-frame-navigate',
      'will-navigate',
      'will-redirect',
    ]);
  });

  it.each(['will-navigate', 'will-redirect', 'will-frame-navigate'])(
    '%s to a foreign URL is prevented and logged without the URL',
    (event) => {
      const fake = fakeWebContents();
      const logger = log();
      installNavigationGuards(
        { on: (_e, listener) => listener({}, fake.contents) } as WebContentsCreatedSource,
        ['app://renderer'],
        logger,
      );
      expect(fake.emit(event, 'https://evil.example/?token=secret')).toBe(true);
      expect(logger.warn).toHaveBeenCalledWith('navigation.blocked');
      expect(JSON.stringify((logger.warn as ReturnType<typeof vi.fn>).mock.calls)).not.toContain(
        'secret',
      );
    },
  );

  it.each(['will-navigate', 'will-redirect', 'will-frame-navigate'])(
    '%s inside the trusted origin is allowed',
    (event) => {
      const fake = fakeWebContents();
      installNavigationGuards(
        { on: (_e, listener) => listener({}, fake.contents) } as WebContentsCreatedSource,
        ['app://renderer'],
        log(),
      );
      expect(fake.emit(event, 'app://renderer/index.html')).toBe(false);
    },
  );

  it('denies every window.open and every webview attachment', () => {
    const fake = fakeWebContents();
    const logger = log();
    adaptWebContents(fake.contents).denyWindowOpen();
    expect(fake.openWindow()).toEqual({ action: 'deny' });
    installNavigationGuards(
      { on: (_e, listener) => listener({}, fake.contents) } as WebContentsCreatedSource,
      ['app://renderer'],
      logger,
    );
    expect(fake.emit('will-attach-webview')).toBe(true);
    expect(logger.warn).toHaveBeenCalledWith('webview.blocked');
  });

  it('guards every web contents the app creates, not only the first', () => {
    const first = fakeWebContents();
    const second = fakeWebContents();
    const handlers: ((e: unknown, c: WebContents) => void)[] = [];
    installNavigationGuards(
      { on: (_e, listener) => void handlers.push(listener) } as WebContentsCreatedSource,
      ['app://renderer'],
      log(),
    );
    handlers.forEach((h) => {
      h({}, first.contents);
      h({}, second.contents);
    });
    expect(first.emit('will-navigate', 'http://x.test/')).toBe(true);
    expect(second.emit('will-navigate', 'http://x.test/')).toBe(true);
  });
});
