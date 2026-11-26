import { STRINGS } from '@renderer/app/strings/en';
import { RegionFrame } from '@renderer/components/region-frame';
import type { VisualizerPane } from './use-visualizer';
import styles from './visualizer-view.module.css';

export interface VisualizerViewProps {
  readonly panes: readonly VisualizerPane[];
}

export function VisualizerView({ panes }: VisualizerViewProps) {
  return (
    <RegionFrame
      id="visualization"
      titleId="visualization-heading"
      heading={STRINGS.regions.visualization}
    >
      <div className={styles.root}>
        <p data-part="unavailable-note">{STRINGS.visualizer.unavailable}</p>
        {panes.map((pane) => (
          <div key={pane.id} role="group" aria-label={pane.label} data-part={pane.id}>
            <span data-part="pane-label">{pane.label}</span>
            <span data-part="pane-state">{STRINGS.notAvailable}</span>
          </div>
        ))}
      </div>
    </RegionFrame>
  );
}
