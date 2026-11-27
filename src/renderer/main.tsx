import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppShell } from '@renderer/app/app-shell';
import { createDomAudioEngine } from '@renderer/audio';
import { createLibraryClient, createNecroampClient } from '@renderer/app/bridge/necroamp-client';
import { createAppInfoStore } from '@renderer/stores/app-info-store';
import { createPlayerStore } from '@renderer/stores/player-store';
import '@renderer/app/styles/tokens.css';
import '@renderer/app/styles/global.css';

const container = document.getElementById('root');
if (container === null) {
  throw new Error('Missing #root element.');
}

// The store is created here and injected, never a module-level singleton (R10.1).
const appInfoStore = createAppInfoStore(createNecroampClient(window));

const playerStore = createPlayerStore(createDomAudioEngine(), createLibraryClient(window));
// Release the media element and listeners when the window goes away.
window.addEventListener('pagehide', () => {
  playerStore.getState().dispose();
});

createRoot(container).render(
  <StrictMode>
    <AppShell appInfoStore={appInfoStore} playerStore={playerStore} />
  </StrictMode>,
);
