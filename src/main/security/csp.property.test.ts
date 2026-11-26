import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { APP_ORIGIN } from '../constants';
import { buildCsp, buildMetaCsp, type CspOptions } from './csp';
import { installDevCspHook, type ResponseHeaders } from './dev-csp';
import { isTrustedSender } from './sender-validation';
import { isTrustedUrl, originOf, parseDevOrigin, resolveTrustedOrigins } from './trusted-origins';

// Human gate 3 / R5 / ADR 0003 item 6: production CSP never inherits a development allowance.
const PRODUCTION_BASELINE = buildCsp({ mode: 'production' });
const FORBIDDEN_IN_PRODUCTION = [
  'unsafe-inline',
  'unsafe-eval',
  'localhost',
  '127.0.0.1',
  'ws:',
  'wss:',
  'http:',
  'https:',
  'data:',
  'blob:',
  'filesystem:',
  '*',
];

const devOrigin = fc
  .tuple(fc.constantFrom('localhost', '127.0.0.1'), fc.integer({ min: 1, max: 65535 }))
  .map(([host, port]) => `http://${host}:${port}`);

const anyOrigin = fc.oneof(
  devOrigin,
  fc.string(),
  fc.webUrl(),
  fc.constant('https://evil.example:443'),
);

const mangledOptions = fc
  .record({
    mode: fc.oneof(
      fc.constant('production'),
      fc.string(),
      fc.constant('Development'),
      fc.constant('dev'),
    ),
    devOrigin: anyOrigin,
    isDev: fc.boolean(),
    unsafeInline: fc.boolean(),
    NODE_ENV: fc.string(),
  })
  .filter((o) => o.mode !== 'development');

describe('production CSP isolation (properties)', () => {
  it('equals the constant baseline for every option object that is not mode development', () => {
    fc.assert(
      fc.property(mangledOptions, (options) => {
        expect(buildCsp(options as unknown as CspOptions)).toBe(PRODUCTION_BASELINE);
      }),
    );
  });

  it('never contains a development or remote allowance', () => {
    for (const token of FORBIDDEN_IN_PRODUCTION) {
      expect(PRODUCTION_BASELINE).not.toContain(token);
      expect(buildMetaCsp({ mode: 'production' })).not.toContain(token);
    }
    fc.assert(
      fc.property(mangledOptions, (options) => {
        const csp = buildCsp(options as unknown as CspOptions);
        const meta = buildMetaCsp(options as unknown as CspOptions);
        for (const token of FORBIDDEN_IN_PRODUCTION) {
          expect(csp).not.toContain(token);
          expect(meta).not.toContain(token);
        }
      }),
    );
  });

  it('has script-src and style-src of exactly self, and connect-src none', () => {
    const directives = new Map(
      PRODUCTION_BASELINE.split('; ').map((d) => [
        d.split(' ')[0] ?? '',
        d.split(' ').slice(1).join(' '),
      ]),
    );
    expect(directives.get('script-src')).toBe("'self'");
    expect(directives.get('style-src')).toBe("'self'");
    expect(directives.get('connect-src')).toBe("'none'");
    expect(directives.get('default-src')).toBe("'none'");
  });

  it('the meta copy differs from the header policy only by the directives meta ignores', () => {
    const header = PRODUCTION_BASELINE.split('; ');
    const meta = buildMetaCsp({ mode: 'production' }).split('; ');
    expect(header.filter((d) => !meta.includes(d)).map((d) => d.split(' ')[0])).toEqual([
      'frame-ancestors',
    ]);
  });
});

describe('development CSP (properties)', () => {
  it('never contains unsafe-eval or a remote source for any valid dev origin', () => {
    fc.assert(
      fc.property(devOrigin, (origin) => {
        const csp = buildCsp({ mode: 'development', devOrigin: origin });
        expect(csp).not.toContain('unsafe-eval');
        expect(csp).not.toMatch(/https?:\/\/(?!(localhost|127\.0\.0\.1):\d+)/);
        expect(csp).not.toMatch(/\bwss?:\/\/(?!(localhost|127\.0\.0\.1):\d+)/);
        expect(csp).not.toContain('*');
        const script = csp.split('; ').find((d) => d.startsWith('script-src '));
        expect(script).toBe("script-src 'self' 'unsafe-inline'");
      }),
    );
  });

  it('either throws a plain error or stays free of unsafe-eval for arbitrary dev origins', () => {
    fc.assert(
      fc.property(fc.oneof(fc.string(), fc.webUrl()), (origin) => {
        try {
          const csp = buildCsp({ mode: 'development', devOrigin: origin });
          expect(csp).not.toContain('unsafe-eval');
          expect(csp).not.toContain('*');
          expect(parseDevOrigin(origin)).not.toBeNull();
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect(parseDevOrigin(origin)).toBeNull();
        }
      }),
    );
  });

  it('the dev header hook leaves other origins untouched and sets exactly one CSP on the dev origin', () => {
    fc.assert(
      fc.property(
        devOrigin,
        fc.webUrl(),
        fc.dictionary(fc.string(), fc.string()),
        (origin, other, extra) => {
          let listener:
            | ((
                d: { url: string; responseHeaders?: ResponseHeaders },
                cb: (r: { responseHeaders?: ResponseHeaders }) => void,
              ) => void)
            | undefined;
          expect(installDevCspHook({ onHeadersReceived: (l) => (listener = l) }, origin)).toBe(
            true,
          );
          let out: ResponseHeaders | undefined;
          listener?.(
            {
              url: `${origin}/x`,
              responseHeaders: { ...extra, 'content-security-policy': ['bad'] },
            },
            (r) => {
              out = r.responseHeaders;
            },
          );
          const cspKeys = Object.keys(out ?? {}).filter(
            (k) => k.toLowerCase() === 'content-security-policy',
          );
          expect(cspKeys).toEqual(['Content-Security-Policy']);
          if (originOf(other) !== origin) {
            let untouched: ResponseHeaders | undefined = { sentinel: 'x' };
            listener?.({ url: other }, (r) => {
              untouched = r.responseHeaders;
            });
            expect(untouched).toBeUndefined();
          }
        },
      ),
    );
  });

  it('refuses to install the dev hook for a non-loopback origin', () => {
    fc.assert(
      fc.property(
        fc.webUrl().filter((u) => parseDevOrigin(u) === null),
        (origin) => {
          let called = false;
          expect(installDevCspHook({ onHeadersReceived: () => (called = true) }, origin)).toBe(
            false,
          );
          expect(called).toBe(false);
        },
      ),
    );
  });
});

describe('trusted origins and sender validation (properties)', () => {
  const production = resolveTrustedOrigins({ mode: 'production' });

  it('never throws for arbitrary unknown values', () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        expect(() => originOf(value)).not.toThrow();
        expect(() => isTrustedUrl(value, production)).not.toThrow();
        expect(() => parseDevOrigin(value)).not.toThrow();
      }),
    );
  });

  it('production trusts only the app origin, whatever dev option is supplied', () => {
    fc.assert(
      fc.property(anyOrigin, (origin) => {
        expect(resolveTrustedOrigins({ mode: 'production' })).toEqual([APP_ORIGIN]);
        const dev = resolveTrustedOrigins({ mode: 'development', devOrigin: origin });
        expect(dev[0]).toBe(APP_ORIGIN);
        expect(dev.length).toBeLessThanOrEqual(2);
        for (const o of dev.slice(1)) expect(parseDevOrigin(o)).not.toBeNull();
      }),
    );
  });

  it('a trusted URL always parses to the app scheme and host without credentials', () => {
    fc.assert(
      fc.property(fc.oneof(fc.string(), fc.webUrl(), fc.constant('app://renderer/x')), (value) => {
        if (!isTrustedUrl(value, production)) return;
        const url = new URL(value);
        expect(url.protocol).toBe('app:');
        expect(url.hostname).toBe('renderer');
        expect(url.username + url.password).toBe('');
      }),
    );
  });

  it('rejects look-alike hosts and userinfo tricks', () => {
    const hosts = fc.constantFrom(
      'app://renderer.evil.com/',
      'app://evil.com/renderer',
      'app://renderer@evil.com/',
      'app://evil.com@renderer/',
      'app://renderer:1/',
      'app://RENDERER/',
      'http://renderer/',
      'file://renderer/',
    );
    fc.assert(
      fc.property(hosts, (url) => {
        expect(isTrustedUrl(url, production)).toBe(false);
      }),
    );
  });

  const frame = fc.record({
    url: fc.oneof(fc.string(), fc.constant('app://renderer/index.html')),
    parent: fc.anything(),
  });

  it('never throws on arbitrary events and returns a boolean', () => {
    fc.assert(
      fc.property(fc.anything(), (event) => {
        const result = isTrustedSender(event as never, production, () => true);
        expect(typeof result).toBe('boolean');
      }),
    );
  });

  it('rejects every sub-frame, whatever the URL', () => {
    fc.assert(
      fc.property(
        frame.filter((f) => f.parent !== null),
        (f) => {
          expect(isTrustedSender({ senderFrame: f, sender: {} }, production, () => true)).toBe(
            false,
          );
        },
      ),
    );
  });

  it('rejects an unregistered sender even for a perfect frame', () => {
    fc.assert(
      fc.property(fc.anything(), (sender) => {
        const event = { senderFrame: { url: 'app://renderer/index.html', parent: null }, sender };
        expect(isTrustedSender(event, production, () => false)).toBe(false);
      }),
    );
  });

  it('fails closed when reading the frame throws', () => {
    const event = {
      get senderFrame(): never {
        throw new Error('destroyed');
      },
    };
    expect(isTrustedSender(event, production, () => true)).toBe(false);
  });

  it('rejects any top frame whose URL is not trusted', () => {
    fc.assert(
      fc.property(fc.oneof(fc.string(), fc.webUrl()), (url) => {
        fc.pre(!isTrustedUrl(url, production));
        const event = { senderFrame: { url, parent: null }, sender: {} };
        expect(isTrustedSender(event, production, () => true)).toBe(false);
      }),
    );
  });
});
