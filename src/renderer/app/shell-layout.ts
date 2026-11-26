import { REGION_IDS, type RegionId } from '@renderer/components/region-frame';

export { REGION_IDS, type RegionId };

/**
 * Which regions exist and in which order. `order` is the DOM, reading and tab order.
 * `areas` are CSS grid-area names applied by the CSS Module through `data-region`.
 * No pixels, colors or asset paths belong here. Only FOUNDATION_LAYOUT is approved.
 */
export interface LayoutDescriptor {
  readonly id: string;
  readonly order: readonly RegionId[];
  readonly areas: Readonly<Record<RegionId, string>>;
}

export const FOUNDATION_LAYOUT: LayoutDescriptor = {
  id: 'foundation',
  order: REGION_IDS,
  areas: {
    player: 'player',
    playlist: 'playlist',
    equalizer: 'equalizer',
    visualization: 'visualization',
    'skin-selector': 'skin-selector',
    github: 'github',
  },
};
