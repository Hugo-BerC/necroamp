import { describe, expect, it, vi } from 'vitest';
import { buildCsp } from './csp';
import {
  installDevCspHook,
  withCspHeader,
  type HeadersDetails,
  type ResponseHeaders,
} from './dev-csp';

const DEV = 'http://localhost:5173';

type Listener = (
  details: HeadersDetails,
  callback: (response: { responseHeaders?: ResponseHeaders }) => void,
) => void;

function capture(): {
  webRequest: { onHeadersReceived(l: Listener): void };
  listener: () => Listener;
} {
  let stored: Listener | undefined;
  return {
    webRequest: {
      onHeadersReceived(l) {
        stored = l;
      },
    },
    listener: () => {
      if (stored === undefined) throw new Error('no listener');
      return stored;
    },
  };
}

describe('withCspHeader', () => {
  it('replaces CSP headers of any case and keeps other headers', () => {
    const result = withCspHeader(
      { 'content-security-policy': ['x'], 'Content-Security-Policy': ['y'], 'X-A': ['1'] },
      'policy',
    );
    expect(result).toEqual({ 'X-A': ['1'], 'Content-Security-Policy': ['policy'] });
  });
});

describe('installDevCspHook', () => {
  it('adds the dev policy to responses from the dev origin only', () => {
    const { webRequest, listener } = capture();
    expect(installDevCspHook(webRequest, DEV)).toBe(true);
    const callback = vi.fn();
    listener()({ url: `${DEV}/src/main.tsx`, responseHeaders: { A: ['1'] } }, callback);
    expect(callback).toHaveBeenCalledWith({
      responseHeaders: {
        A: ['1'],
        'Content-Security-Policy': [buildCsp({ mode: 'development', devOrigin: DEV })],
      },
    });
  });

  it('leaves other origins untouched', () => {
    const { webRequest, listener } = capture();
    installDevCspHook(webRequest, DEV);
    const callback = vi.fn();
    listener()({ url: 'https://evil.test/x', responseHeaders: { A: ['1'] } }, callback);
    expect(callback).toHaveBeenCalledWith({ responseHeaders: { A: ['1'] } });
  });

  it('installs nothing for an invalid dev origin', () => {
    const onHeadersReceived = vi.fn();
    expect(installDevCspHook({ onHeadersReceived }, 'https://evil.test')).toBe(false);
    expect(onHeadersReceived).not.toHaveBeenCalled();
  });
});
