export const REGION_IDS = [
  'player',
  'playlist',
  'equalizer',
  'visualization',
  'skin-selector',
  'github',
] as const;

/** Stable region ids. A future Skin Engine layout references these, so they are not renamed. */
export type RegionId = (typeof REGION_IDS)[number];
