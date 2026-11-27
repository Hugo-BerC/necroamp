import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { isSafeAssetPath } from './asset-path';

describe('isSafeAssetPath', () => {
  it.each([
    'assets/bg.svg',
    'assets/a/b/c/d.png',
    'assets/tex_1-x.webp',
    'assets/fonts/display.woff2',
  ])('accepts %s', (p) => {
    expect(isSafeAssetPath(p)).toBe(true);
  });

  it.each([
    '',
    'bg.svg',
    '../assets/bg.svg',
    'assets/../bg.svg',
    'assets/./bg.svg',
    '/assets/bg.svg',
    'C:/assets/bg.svg',
    'C:\\assets\\bg.svg',
    '\\\\server\\share\\bg.svg',
    '//server/share/bg.svg',
    'assets\\bg.svg',
    'assets/a\\..\\bg.svg',
    'assets/%2e%2e/bg.svg',
    'assets/bg.svg:stream',
    'assets/bg.svg\0',
    'assets/bg.svg.',
    'assets/bg.svg ',
    'assets/BG.svg',
    'assets/bg.js',
    'assets/bg.svg.js',
    'assets/con.svg',
    'assets/a/nul.png',
    'assets/lpt1.png',
    'assets/a/b/c/d/e.png',
    `assets/${'a'.repeat(49)}.png`,
    'file:///assets/bg.svg',
  ])('rejects %j', (p) => {
    expect(isSafeAssetPath(p)).toBe(false);
  });

  it('rejects non-strings', () => {
    for (const v of [null, undefined, 1, {}, [], ['assets/bg.svg']]) {
      expect(isSafeAssetPath(v)).toBe(false);
    }
  });
});

describe('isSafeAssetPath (property)', () => {
  it('never throws and never accepts an escaping or non-canonical path', () => {
    fc.assert(
      fc.property(fc.oneof(fc.string(), fc.string({ unit: 'binary' }), fc.anything()), (input) => {
        const ok = isSafeAssetPath(input);
        if (ok) {
          const s = input as string;
          expect(s.startsWith('assets/')).toBe(true);
          for (const bad of ['..', '\\', ':', '%', '\0']) {
            expect(s.includes(bad)).toBe(false);
          }
          expect(s.startsWith('/')).toBe(false);
          expect(s.split('/').every((seg) => seg !== '' && seg !== '.')).toBe(true);
        }
      }),
      { numRuns: 500 },
    );
  });

  it('rejects any valid path with a traversal or separator trick spliced in', () => {
    const tricks = ['..', '\\', ':', '%2e', '//', '\0', ' '];
    fc.assert(
      fc.property(fc.constantFrom(...tricks), fc.nat({ max: 12 }), (trick, at) => {
        const base = 'assets/a/b.png';
        const mutated = base.slice(0, at) + trick + base.slice(at);
        expect(isSafeAssetPath(mutated)).toBe(false);
      }),
    );
  });
});
