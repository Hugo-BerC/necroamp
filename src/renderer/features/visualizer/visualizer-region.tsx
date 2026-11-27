import { useAudioProcessingContext } from '@renderer/stores/audio-processing-context';
import { usePlayerStoreContext } from '@renderer/stores/player-store-context';
import type { AudioProcessing } from '@renderer/audio';
import { LiveVisualizerView } from './live-visualizer-view';
import { useLiveVisualizer } from './use-live-visualizer';
import { useVisualizerPanes } from './use-visualizer';
import { VisualizerView } from './visualizer-view';

function LiveVisualizerRegion({ processing }: { readonly processing: AudioProcessing }) {
  const player = usePlayerStoreContext();
  return <LiveVisualizerView {...useLiveVisualizer(processing, player)} />;
}

function PlaceholderVisualizerRegion() {
  return <VisualizerView panes={useVisualizerPanes()} />;
}

/** Live visualizer when audio processing is provided, otherwise the inert placeholder. */
export function VisualizerRegion() {
  const processing = useAudioProcessingContext();
  return processing === null ? (
    <PlaceholderVisualizerRegion />
  ) : (
    <LiveVisualizerRegion processing={processing} />
  );
}
