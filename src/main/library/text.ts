function isControl(char: string): boolean {
  const code = char.charCodeAt(0);
  return code < 0x20 || code === 0x7f;
}

/**
 * Normalizes untrusted display text: strips control characters, trims and caps the length by
 * code point so a surrogate pair is never split.
 */
export function cleanText(value: string, max: number): string {
  return Array.from(value)
    .filter((char) => !isControl(char))
    .slice(0, max)
    .join('')
    .trim();
}
