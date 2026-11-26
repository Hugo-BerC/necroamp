import { EqualizerView } from './equalizer-view';
import { useEqualizerBands } from './use-equalizer';

export function EqualizerRegion() {
  return <EqualizerView bands={useEqualizerBands()} />;
}
