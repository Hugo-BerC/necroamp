import { useEqStoreContext } from '@renderer/stores/eq-store-context';
import type { EqStore } from '@renderer/stores/eq-store';
import { EqualizerView } from './equalizer-view';
import { LiveEqualizerView } from './live-equalizer-view';
import { useLiveEqualizer } from './use-live-equalizer';
import { useEqualizerBands } from './use-equalizer';

function LiveEqualizerRegion({ store }: { readonly store: EqStore }) {
  return <LiveEqualizerView eq={useLiveEqualizer(store)} />;
}

function PlaceholderEqualizerRegion() {
  return <EqualizerView bands={useEqualizerBands()} />;
}

/** Live equalizer when a store is provided, otherwise the inert placeholder. */
export function EqualizerRegion() {
  const store = useEqStoreContext();
  return store === null ? <PlaceholderEqualizerRegion /> : <LiveEqualizerRegion store={store} />;
}
