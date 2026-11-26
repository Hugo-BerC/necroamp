/** Pure WCAG 2.x contrast helpers. No DOM, no React. */

const HEX_COLOR = /^#([0-9a-f]{6})$/i;

export type Rgb = readonly [number, number, number];

/** Parses `#rrggbb`. Returns undefined for any other input. */
export function parseHexColor(value: string): Rgb | undefined {
  const match = HEX_COLOR.exec(value.trim());
  const digits = match?.[1];
  if (digits === undefined) {
    return undefined;
  }
  return [
    Number.parseInt(digits.slice(0, 2), 16),
    Number.parseInt(digits.slice(2, 4), 16),
    Number.parseInt(digits.slice(4, 6), 16),
  ];
}

function linearize(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance([r, g, b]: Rgb): number {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/** Contrast ratio in the range 1 to 21. Symmetric in its arguments. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * Reads `--name: value;` declarations from CSS text and resolves `var(--other)` chains.
 * Only the first declaration of a name is used. Returns hex strings for resolvable names.
 */
export function readCustomProperties(css: string): ReadonlyMap<string, string> {
  const raw = new Map<string, string>();
  for (const match of css.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    const name = match[1];
    const value = match[2];
    if (name !== undefined && value !== undefined && !raw.has(name)) {
      raw.set(name, value.trim());
    }
  }
  const resolved = new Map<string, string>();
  for (const name of raw.keys()) {
    let value = raw.get(name);
    for (let depth = 0; depth < 8 && value !== undefined; depth += 1) {
      const ref = /^var\((--[a-z0-9-]+)\)$/i.exec(value);
      if (ref?.[1] === undefined) {
        break;
      }
      value = raw.get(ref[1]);
    }
    if (value !== undefined) {
      resolved.set(name, value);
    }
  }
  return resolved;
}
