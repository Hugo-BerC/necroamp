import { STRINGS } from '@renderer/app/strings/en';

export interface VisualizerPane {
  readonly id: 'spectrum' | 'waveform';
  readonly label: string;
}

const PANES: readonly VisualizerPane[] = [
  { id: 'spectrum', label: STRINGS.visualizer.spectrum },
  { id: 'waveform', label: STRINGS.visualizer.waveform },
];

/** Two labelled placeholder panes. No analyser, canvas or animation loop exists in this phase. */
export function useVisualizerPanes(): readonly VisualizerPane[] {
  return PANES;
}
