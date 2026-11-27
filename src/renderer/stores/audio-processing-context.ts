import { createContext, createElement, useContext, type ReactNode } from 'react';
import type { AudioProcessing } from '@renderer/audio';

const AudioProcessingContext = createContext<AudioProcessing | null>(null);

export interface AudioProcessingProviderProps {
  readonly processing: AudioProcessing;
  readonly children: ReactNode;
}

export function AudioProcessingProvider({ processing, children }: AudioProcessingProviderProps) {
  return createElement(AudioProcessingContext.Provider, { value: processing }, children);
}

/** Read-only data source for visualizers. `null` shows the inert placeholder. */
export function useAudioProcessingContext(): AudioProcessing | null {
  return useContext(AudioProcessingContext);
}
