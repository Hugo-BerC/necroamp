import { describe, expect, it, vi } from 'vitest';
import type { Logger } from '../logging/logger';
import {
  attachNavigationGuards,
  isNavigationAllowed,
  type GuardedContents,
  type NavigationDetails,
} from './navigation-guards';

const TRUSTED = ['app://renderer'];
const silentLog = (): Logger => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() });

function fakeContents() {
  const state: {
    navigation?: (d: NavigationDetails) => void;
    webview?: (e: { preventDefault(): void }) => void;
    windowOpenDenied: boolean;
  } = { windowOpenDenied: false };
  const contents: GuardedContents = {
    onNavigation: (l) => {
      state.navigation = l;
    },
    onWebviewAttach: (l) => {
      state.webview = l;
    },
    denyWindowOpen: () => {
      state.windowOpenDenied = true;
    },
  };
  return { contents, state };
}

const navigate = (state: ReturnType<typeof fakeContents>['state'], url: string): boolean => {
  const preventDefault = vi.fn();
  state.navigation?.({ url, preventDefault });
  return preventDefault.mock.calls.length > 0;
};

describe('isNavigationAllowed', () => {
  it('allows only trusted origins', () => {
    expect(isNavigationAllowed('app://renderer/index.html', TRUSTED)).toBe(true);
    expect(isNavigationAllowed('https://github.com/', TRUSTED)).toBe(false);
  });
});

describe('attachNavigationGuards', () => {
  it('installs navigation, webview and window-open guards', () => {
    const { contents, state } = fakeContents();
    attachNavigationGuards(contents, TRUSTED, silentLog());
    expect(state.navigation).toBeTypeOf('function');
    expect(state.webview).toBeTypeOf('function');
    expect(state.windowOpenDenied).toBe(true);
  });

  it('allows in-app navigation to the entry URL', () => {
    const { contents, state } = fakeContents();
    attachNavigationGuards(contents, TRUSTED, silentLog());
    expect(navigate(state, 'app://renderer/index.html')).toBe(false);
  });

  it.each([
    'https://evil.test/',
    'http://localhost:5173/',
    'file:///C:/Windows/win.ini',
    'javascript:alert(1)',
    'data:text/html,<script>1</script>',
    'about:blank',
    'app://evil/',
    'app://renderer.evil.test/',
    '',
  ])('prevents navigation or redirect to %s', (url) => {
    const { contents, state } = fakeContents();
    const log = silentLog();
    attachNavigationGuards(contents, TRUSTED, log);
    expect(navigate(state, url)).toBe(true);
    expect(log.warn).toHaveBeenCalledWith('navigation.blocked');
  });

  it('does not log the blocked URL', () => {
    const { contents, state } = fakeContents();
    const log = silentLog();
    attachNavigationGuards(contents, TRUSTED, log);
    navigate(state, 'https://evil.test/?token=abc');
    expect(JSON.stringify((log.warn as ReturnType<typeof vi.fn>).mock.calls)).not.toContain(
      'token',
    );
  });

  it('prevents every webview attach', () => {
    const { contents, state } = fakeContents();
    attachNavigationGuards(contents, TRUSTED, silentLog());
    const preventDefault = vi.fn();
    state.webview?.({ preventDefault });
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });
});
