import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppShell } from '@renderer/app/app-shell';
import { createDomAudioEngine } from '@renderer/audio';
import {
  createLibraryClient,
  createMenuClient,
  createNecroampClient,
  createPlaylistClient,
} from '@renderer/app/bridge/necroamp-client';
import { connectNativeMenu } from '@renderer/app/bridge/native-menu';
import { createAppInfoStore } from '@renderer/stores/app-info-store';
import { createEqStore } from '@renderer/stores/eq-store';
import { createPlayerPort } from '@renderer/stores/player-port';
import { createPlayerStore } from '@renderer/stores/player-store';
import { createPlaylistStore } from '@renderer/stores/playlist-store';
import '@renderer/app/styles/tokens.css';
import '@renderer/app/styles/global.css';

const container = document.getElementById('root');
if (container === null) {
  throw new Error('Missing #root element.');
}

// The store is created here and injected, never a module-level singleton (R10.1).
const appInfoStore = createAppInfoStore(createNecroampClient(window));

const libraryClient = createLibraryClient(window);
const audioEngine = createDomAudioEngine();
const playerStore = createPlayerStore(audioEngine, libraryClient);
// Settings persistence for the equalizer waits for the settings IPC contract (Block C1/C2).
const eqStore = createEqStore(audioEngine.processing);
const playlistStore = createPlaylistStore(
  createPlayerPort(playerStore),
  libraryClient,
  createPlaylistClient(window),
);
// Subscribe once for the app lifetime; the disposer runs on pagehide.
const disconnectMenu = connectNativeMenu(createMenuClient(window), playlistStore);
void playlistStore.getState().load();
// Release the media element and listeners when the window goes away.
window.addEventListener('pagehide', () => {
  disconnectMenu();
  void playlistStore.getState().flush();
  playlistStore.getState().dispose();
  playerStore.getState().dispose();
});

createRoot(container).render(
  <StrictMode>
    <AppShell
      appInfoStore={appInfoStore}
      playerStore={playerStore}
      playlistStore={playlistStore}
      eqStore={eqStore}
      audioProcessing={audioEngine.processing}
    />
  </StrictMode>,
);
