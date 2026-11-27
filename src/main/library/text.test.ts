import { describe, expect, it } from 'vitest';
import { cleanText } from './text';

describe('cleanText', () => {
  it('strips control characters, trims and caps by code point', () => {
    expect(cleanText('  a\u0000b\u007f\nc  ', 10)).toBe('abc');
    expect(cleanText('abcdef', 3)).toBe('abc');
    expect(cleanText('😀😀😀', 2)).toBe('😀😀');
    expect(cleanText('\u0001\u0002', 5)).toBe('');
  });
});
