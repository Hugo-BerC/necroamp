import { useVisualizerPanes } from './use-visualizer';
import { VisualizerView } from './visualizer-view';

export function VisualizerRegion() {
  return <VisualizerView panes={useVisualizerPanes()} />;
}
