import { describe, expect, it } from 'vitest';
import { FOUNDATION_LAYOUT, REGION_IDS } from './shell-layout';
import { STRINGS } from './strings/en';

describe('FOUNDATION_LAYOUT', () => {
  it('lists the six stable region ids in order', () => {
    expect(REGION_IDS).toEqual([
      'player',
      'playlist',
      'equalizer',
      'visualization',
      'skin-selector',
      'github',
    ]);
    expect(FOUNDATION_LAYOUT.order).toEqual(REGION_IDS);
  });

  it('names a distinct grid area for every region and holds no style values', () => {
    const areas = REGION_IDS.map((id) => FOUNDATION_LAYOUT.areas[id]);
    expect(new Set(areas).size).toBe(REGION_IDS.length);
    expect(JSON.stringify(FOUNDATION_LAYOUT)).not.toMatch(/#[0-9a-f]{3,8}|px|url\(/i);
  });

  it('has a heading string for each region', () => {
    for (const id of REGION_IDS) {
      expect(STRINGS.regions[id].length).toBeGreaterThan(0);
    }
  });
});

describe('STRINGS', () => {
  it('keeps the exact tagline', () => {
    expect(STRINGS.tagline).toBe('Code. Listen. Repeat.');
  });

  it('has ten equalizer frequencies', () => {
    expect(STRINGS.equalizer.frequencies).toHaveLength(10);
  });
});
