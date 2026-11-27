/**
 * C0, DEL, C1, and format characters that can spoof display: zero-width space, LRM/RLM, the
 * bidi embedding/override block, bidi isolates and the byte order mark. U+200C (ZWNJ) and U+200D
 * (ZWJ) are kept because emoji sequences and several scripts need them.
 */
function isControl(char: string): boolean {
  const code = char.charCodeAt(0);
  return (
    code < 0x20 ||
    (code >= 0x7f && code <= 0x9f) ||
    code === 0x200b ||
    code === 0x200e ||
    code === 0x200f ||
    (code >= 0x202a && code <= 0x202e) ||
    (code >= 0x2066 && code <= 0x2069) ||
    code === 0xfeff
  );
}
/**
 * Normalizes untrusted display text: strips control and bidi/format characters, trims and caps
 * the length by code point so a surrogate pair is never split.
 */
export function cleanText(value: string, max: number): string {
  return Array.from(value)
    .filter((char) => !isControl(char))
    .slice(0, max)
    .join('')
    .trim();
}
