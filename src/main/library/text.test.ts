import { describe, expect, it } from 'vitest';
import { cleanText } from './text';
describe('cleanText', () => {
  it('strips control characters, trims and caps by code point', () => {
    expect(cleanText('  a\u0000b\u007f\nc  ', 10)).toBe('abc');
    expect(cleanText('abcdef', 3)).toBe('abc');
    expect(cleanText('😀😀😀', 2)).toBe('😀😀');
    expect(cleanText('\u0001\u0002', 5)).toBe('');
  });

  it('strips every C1 control character', () => {
    for (let code = 0x80; code <= 0x9f; code += 1) {
      expect(cleanText(`a${String.fromCharCode(code)}b`, 10)).toBe('ab');
    }
  });

  it('strips bidi and format characters that can spoof display', () => {
    expect(cleanText('a\u200bb\u200ec\u200fd\u202ae\u202ef\u2066g\u2069h\ufeffi', 20)).toBe(
      'abcdefghi',
    );
  });

  it('keeps accents, CJK, emoji, ZWJ sequences and NBSP', () => {
    const text = 'Café 日本語 한국어 😀 👨‍👩‍👧 “x” \u00a0\u00a1\u00ff';
    expect(cleanText(text, 100)).toBe(text.trim());
  });
});
