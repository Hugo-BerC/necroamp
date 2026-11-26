import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { contrastRatio, parseHexColor, readCustomProperties, type Rgb } from './contrast';

// Vitest runs from the repository root (jsdom has no file: import.meta.url).
const RENDERER_ROOT = join(process.cwd(), 'src', 'renderer');
const tokensCss = readFileSync(join(RENDERER_ROOT, 'app', 'styles', 'tokens.css'), 'utf8');
const tokens = readCustomProperties(tokensCss);

function color(name: string): Rgb {
  const parsed = parseHexColor(tokens.get(name) ?? '');
  if (parsed === undefined) {
    throw new Error(`Token ${name} does not resolve to a hex color.`);
  }
  return parsed;
}

describe('contrast helpers', () => {
  it('computes the extremes', () => {
    expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 5);
    expect(contrastRatio([10, 20, 30], [10, 20, 30])).toBeCloseTo(1, 5);
  });

  it('is symmetric', () => {
    expect(contrastRatio([1, 2, 3], [200, 100, 50])).toBeCloseTo(
      contrastRatio([200, 100, 50], [1, 2, 3]),
      10,
    );
  });

  it('parses only #rrggbb', () => {
    expect(parseHexColor('#0d1012')).toEqual([13, 16, 18]);
    expect(parseHexColor('red')).toBeUndefined();
    expect(parseHexColor('#fff')).toBeUndefined();
  });
});

describe('foundation tokens (R9.3, R9.4)', () => {
  const textPairs: ReadonlyArray<readonly [string, string]> = [
    ['--na-color-text', '--na-color-app-bg'],
    ['--na-color-text', '--na-color-surface'],
    ['--na-color-text', '--na-color-surface-raised'],
    ['--na-color-text', '--na-color-surface-inset'],
    ['--na-color-text-muted', '--na-color-app-bg'],
    ['--na-color-text-muted', '--na-color-surface'],
    ['--na-color-text-muted', '--na-color-surface-raised'],
    ['--na-color-text-muted', '--na-color-surface-inset'],
    ['--na-color-accent', '--na-color-surface'],
    ['--na-color-accent', '--na-color-surface-inset'],
    ['--na-color-on-accent', '--na-color-accent'],
    ['--na-color-danger', '--na-color-surface'],
    ['--na-color-warning', '--na-color-surface'],
    ['--na-color-warning', '--na-color-app-bg'],
  ];
  it.each(textPairs)('text %s on %s is at least 4.5:1', (fg, bg) => {
    expect(contrastRatio(color(fg), color(bg))).toBeGreaterThanOrEqual(4.5);
  });

  const nonTextPairs: ReadonlyArray<readonly [string, string]> = [
    ['--na-color-border-control', '--na-color-surface'],
    ['--na-color-border-control', '--na-color-surface-raised'],
    ['--na-color-border-control', '--na-color-surface-inset'],
    ['--na-color-focus', '--na-color-app-bg'],
    ['--na-color-focus', '--na-color-surface'],
    ['--na-color-focus', '--na-color-surface-raised'],
  ];
  it.each(nonTextPairs)('indicator %s on %s is at least 3:1', (fg, bg) => {
    expect(contrastRatio(color(fg), color(bg))).toBeGreaterThanOrEqual(3);
  });
});

describe('styling rules (T5.3)', () => {
  it('components never reference raw palette tokens or literal colors', async () => {
    const { readdirSync } = await import('node:fs');
    const root = RENDERER_ROOT;
    const files = (readdirSync(root, { recursive: true }) as string[]).filter((f) =>
      f.endsWith('.module.css'),
    );
    expect(files.length).toBeGreaterThanOrEqual(10);
    for (const file of files) {
      const css = readFileSync(`${root}/${file}`, 'utf8');
      expect(css, file).not.toMatch(/#[0-9a-f]{3,8}\b/i);
      expect(css, file).not.toMatch(/--na-raw-/);
      expect(css, file).not.toMatch(/@import|url\(/);
    }
  });
});
