import type { WebContents } from 'electron';
import type { Logger } from '../logging/logger';
import { isTrustedUrl } from '../security/trusted-origins';

/**
 * Navigation, new-window and webview restrictions (design section 3.3, R6.1 to R6.3, R6.5).
 *
 * Decisions are pure (`isNavigationAllowed`). Electron wiring is a thin adapter. `will-navigate`,
 * `will-redirect`, `will-frame-navigate` and `will-attach-webview` are declared by the
 * Electron 45.5.0 typings (T2.0).
 */
export interface NavigationDetails {
  readonly url: string;
  preventDefault(): void;
}

export interface GuardedContents {
  onNavigation(listener: (details: NavigationDetails) => void): void;
  onWebviewAttach(listener: (event: { preventDefault(): void }) => void): void;
  denyWindowOpen(): void;
}

/** Same-origin navigation to a trusted origin only. Everything else is denied. */
export function isNavigationAllowed(url: unknown, trusted: readonly string[]): boolean {
  return isTrustedUrl(url, trusted);
}

export function attachNavigationGuards(
  contents: GuardedContents,
  trusted: readonly string[],
  log: Logger,
): void {
  contents.onNavigation((details) => {
    if (!isNavigationAllowed(details.url, trusted)) {
      details.preventDefault();
      // The URL is not logged. It may carry a path or a token.
      log.warn('navigation.blocked');
    }
  });
  contents.onWebviewAttach((event) => {
    event.preventDefault();
    log.warn('webview.blocked');
  });
  contents.denyWindowOpen();
}

/** Adapts a real `WebContents` to the structural interface. */
export function adaptWebContents(contents: WebContents): GuardedContents {
  return {
    onNavigation(listener) {
      contents.on('will-navigate', (details) => listener(details));
      contents.on('will-redirect', (details) => listener(details));
      contents.on('will-frame-navigate', (details) => listener(details));
    },
    onWebviewAttach(listener) {
      contents.on('will-attach-webview', (event) => listener(event));
    },
    denyWindowOpen() {
      contents.setWindowOpenHandler(() => ({ action: 'deny' }));
    },
  };
}

export interface WebContentsCreatedSource {
  on(
    event: 'web-contents-created',
    listener: (event: unknown, contents: WebContents) => void,
  ): unknown;
}

/** Guards every web contents the app ever creates, not only the main window's. */
export function installNavigationGuards(
  app: WebContentsCreatedSource,
  trusted: readonly string[],
  log: Logger,
): void {
  app.on('web-contents-created', (_event, contents) => {
    attachNavigationGuards(adaptWebContents(contents), trusted, log);
  });
}
