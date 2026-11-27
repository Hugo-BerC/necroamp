import { STRINGS } from '@renderer/app/strings/en';
import { RegionFrame } from '@renderer/components/region-frame';
import { CANVAS_HEIGHT, CANVAS_WIDTH, type LiveVisualizer } from './use-live-visualizer';
import styles from './visualizer-view.module.css';

/**
 * Presentational visualizer. Two canvases with text alternatives. Sizing is by CSS and
 * canvas attributes only (no inline styles), colors come from CSS custom properties.
 */
export function LiveVisualizerView({ spectrumRef, waveformRef }: LiveVisualizer) {
  return (
    <RegionFrame
      id="visualization"
      titleId="visualization-heading"
      heading={STRINGS.regions.visualization}
    >
      <div className={styles.live}>
        <figure data-part="spectrum">
          <canvas
            ref={spectrumRef}
            data-part="spectrum-canvas"
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            role="img"
            aria-label={STRINGS.visualizer.spectrumDescription}
          />
          <figcaption data-part="pane-label">{STRINGS.visualizer.spectrum}</figcaption>
        </figure>
        <figure data-part="waveform">
          <canvas
            ref={waveformRef}
            data-part="waveform-canvas"
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            role="img"
            aria-label={STRINGS.visualizer.waveformDescription}
          />
          <figcaption data-part="pane-label">{STRINGS.visualizer.waveform}</figcaption>
        </figure>
      </div>
    </RegionFrame>
  );
}
