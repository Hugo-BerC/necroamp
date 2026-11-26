import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { contrastRatio, parseHexColor, readCustomProperties, relativeLuminance } from './contrast';

// R12.2, R9.4: property tests for the contrast function. Run count and seed reporting come from tests/setup.
const channel = fc.integer({ min: 0, max: 255 });
const rgb = fc.tuple(channel, channel, channel);
const hex = (c: readonly [number, number, number]): string =>
  `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;

describe('contrast function properties', () => {
  it('is symmetric and always within [1, 21]', () => {
    fc.assert(
      fc.property(rgb, rgb, (a, b) => {
        const ratio = contrastRatio(a, b);
        expect(ratio).toBeCloseTo(contrastRatio(b, a), 10);
        expect(ratio).toBeGreaterThanOrEqual(1);
        expect(ratio).toBeLessThanOrEqual(21 + 1e-9);
      }),
    );
  });

  it('is exactly 1 for identical colors', () => {
    fc.assert(fc.property(rgb, (a) => contrastRatio(a, a) === 1));
  });

  it('luminance lies in [0, 1] and is monotonic when one channel grows', () => {
    fc.assert(
      fc.property(rgb, fc.integer({ min: 0, max: 2 }), (c, index) => {
        const lum = relativeLuminance(c);
        expect(lum).toBeGreaterThanOrEqual(0);
        expect(lum).toBeLessThanOrEqual(1);
        const brighter: [number, number, number] = [c[0], c[1], c[2]];
        brighter[index] = 255;
        expect(relativeLuminance(brighter)).toBeGreaterThanOrEqual(lum);
      }),
    );
  });

  it('black against any color is at least as contrasting as any darker pair member', () => {
    fc.assert(
      fc.property(rgb, rgb, (a, b) => {
        const white: [number, number, number] = [255, 255, 255];
        expect(contrastRatio(white, [0, 0, 0])).toBeGreaterThanOrEqual(contrastRatio(a, b) - 1e-9);
      }),
    );
  });

  it('parseHexColor round-trips every #rrggbb, in either case and with padding', () => {
    fc.assert(
      fc.property(rgb, fc.boolean(), (c, upper) => {
        const text = upper ? hex(c).toUpperCase() : hex(c);
        expect(parseHexColor(`  ${text} `)).toEqual(c);
      }),
    );
  });

  it('parseHexColor never throws and accepts nothing but #rrggbb', () => {
    fc.assert(
      fc.property(fc.string({ unit: 'binary' }), (text) => {
        const parsed = parseHexColor(text);
        if (parsed !== undefined) expect(text.trim()).toMatch(/^#[0-9a-f]{6}$/i);
      }),
    );
  });

  it('readCustomProperties never throws on arbitrary text, including prototype keys', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string({ unit: 'binary' }),
          fc.constant('--__proto__: #000000; --constructor: var(--constructor); --a: var(--a);'),
          fc
            .array(fc.tuple(fc.stringMatching(/^--[a-z0-9-]{1,6}$/), fc.string()), { maxLength: 8 })
            .map((entries) =>
              entries.map(([name, value]) => `${name}: ${value.replaceAll(';', '')};`).join('\n'),
            ),
        ),
        (css) => {
          const map = readCustomProperties(css);
          for (const [name, value] of map) {
            expect(name.startsWith('--')).toBe(true);
            expect(typeof value).toBe('string');
          }
        },
      ),
    );
  });

  it('resolves var() chains to the terminal value and leaves cycles unresolved', () => {
    expect(readCustomProperties('--a: #112233; --b: var(--a); --c: var(--b);').get('--c')).toBe(
      '#112233',
    );
    expect(
      parseHexColor(readCustomProperties('--x: var(--y); --y: var(--x);').get('--x') ?? ''),
    ).toBeUndefined();
  });
});
