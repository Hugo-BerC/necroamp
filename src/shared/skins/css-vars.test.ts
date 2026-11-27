import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { layoutVariantToGrid, skinToCssVariables } from './css-vars';
import { makeManifest } from './test-manifest';

const UUID = '123e4567-e89b-42d3-a456-426614174000';
const URL = `media://skin/${UUID}`;

describe('skinToCssVariables', () => {
  it('maps tokens to custom properties', () => {
    const vars = skinToCssVariables(makeManifest(), { bg: URL });
    expect(vars['--na-color-app-bg']).toBe('#112233');
    expect(vars['--na-color-on-row-selected']).toBe('#000000');
    expect(vars['--na-space-3']).toBe('8px');
    expect(vars['--na-focus-ring-width']).toBe('2px');
    expect(vars['--na-font-size-4']).toBe('18px');
    expect(vars['--na-font-family-ui']).toBe('"Segoe UI", sans-serif');
    expect(vars['--na-font-family-display']).toBe('"na-skin-test-skin-bg", "Georgia", serif');
    expect(vars['--na-display-caps']).toBe('small-caps');
    expect(vars['--na-display-transform']).toBe('none');
    expect(vars['--na-duration-fast']).toBe('100ms');
    expect(vars['--na-asset-bg']).toBe(`url("${URL}")`);
    expect(vars['--na-surface-app-image']).toBe(`url("${URL}")`);
    expect(vars['--na-surface-app-size']).toBe('64px 64px');
    expect(vars['--na-surface-app-repeat']).toBe('repeat');
  });

  it('omits assets whose URL is missing or not a skin URL', () => {
    const vars = skinToCssVariables(makeManifest(), {
      bg: 'https://evil.example/x.png',
      frame: 'media://skin/not-a-uuid',
    });
    expect(vars['--na-asset-bg']).toBeUndefined();
    expect(vars['--na-asset-frame']).toBeUndefined();
    expect(vars['--na-surface-app-image']).toBe('none');
    expect(vars['--na-surface-app-frame-source']).toBeUndefined();
  });

  it('builds grid properties from a layout variant', () => {
    const grid = layoutVariantToGrid(makeManifest().layout.variants[0]!);
    expect(grid.templateColumns).toBe('1fr');
    expect(grid.templateRows).toBe('auto minmax(10px, 1fr)');
    expect(grid.templateAreas).toBe('"transport" "playlist"');
    expect(grid.gap).toBe('4px');
  });

  it('only ever emits safe values, whatever URLs are supplied (property)', () => {
    fc.assert(
      fc.property(
        fc.dictionary(
          fc.constantFrom('bg', 'frame', 'other'),
          fc.oneof(fc.string(), fc.constant(URL)),
        ),
        (urls) => {
          const vars = skinToCssVariables(makeManifest(), urls);
          for (const [name, value] of Object.entries(vars)) {
            expect(name).toMatch(/^--na-[a-z0-9-]+$/);
            expect(value).not.toMatch(/[;{}\\]/);
            const urlCalls = value.match(/url\(/g) ?? [];
            const allowed =
              value.match(
                /url\("media:\/\/skin\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"\)/g,
              ) ?? [];
            expect(urlCalls.length).toBe(allowed.length);
          }
        },
      ),
      { numRuns: 300 },
    );
  });
});
