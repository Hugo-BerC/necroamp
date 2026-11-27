import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { parseMediaUrl, parseRange } from './media-protocol';

const hex = fc.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);

describe('media protocol parser properties', () => {
  it('never throws for arbitrary input', () => {
    fc.assert(
      fc.property(fc.anything(), fc.anything(), fc.nat(), (url, header, size) => {
        expect(() => parseMediaUrl(url)).not.toThrow();
        expect(() => parseRange(header as string, size)).not.toThrow();
      }),
    );
  });

  it('accepts only the exact token form and returns the token unchanged', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 100 }), (value) => {
        const result = parseMediaUrl(`media://track/${value}`);
        if (result.ok) {
          expect(result.token).toBe(value);
          expect(value).toMatch(/^[0-9a-f-]{36}$/);
        }
      }),
    );
    fc.assert(
      fc.property(hex, (token) => {
        expect(parseMediaUrl(`media://art/${token}`)).toEqual({ ok: true, host: 'art', token });
      }),
    );
  });

  it('never accepts a url containing a separator, dot or percent sign after the host', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 60 }), (junk) => {
        fc.pre(/[./\\%?#:@]/.test(junk));
        expect(parseMediaUrl(`media://track/${junk}`).ok).toBe(false);
      }),
    );
  });

  it('partial ranges stay inside the file and are ordered', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1_000_000 }),
        fc.nat(2_000_000),
        fc.nat(2_000_000),
        (size, a, b) => {
          for (const header of [`bytes=${a}-${b}`, `bytes=${a}-`, `bytes=-${b}`]) {
            const r = parseRange(header, size);
            if (r.kind === 'partial') {
              expect(r.start).toBeGreaterThanOrEqual(0);
              expect(r.end).toBeLessThan(size);
              expect(r.start).toBeLessThanOrEqual(r.end);
            }
          }
        },
      ),
    );
  });
});
