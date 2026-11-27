import path from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { installIpcHandlers } from '@main/ipc/install-ipc';
import { createMediaRegistry } from '@main/library/media-registry';
import type { SenderEventLike } from '@main/security/sender-validation';
import { AppShell } from '@renderer/app/app-shell';
import { createNecroampClient } from '@renderer/app/bridge/necroamp-client';
import { STRINGS } from '@renderer/app/strings/en';
import { createAppInfoStore } from '@renderer/stores/app-info-store';
import { createNecroampApi } from '../../src/preload/create-necroamp-api';

// T6.3: renderer shell -> adapter -> preload API -> installIpcHandlers (registerHandler, sender check).
// Only Electron itself is faked. Covers R4, R8, R10 across all three layers without a real window.
type Listener = (event: SenderEventLike, ...args: unknown[]) => Promise<unknown>;

const log = { info: () => undefined, warn: () => undefined, error: () => undefined };

function mount(options: {
  platform?: string;
  frameUrl?: string;
  parent?: unknown;
  registered?: boolean;
}) {
  const frame = {
    url: options.frameUrl ?? 'app://renderer/index.html',
    parent: options.parent ?? null,
  };
  const sender = { id: 'wc', mainFrame: frame };
  const listeners = new Map<string, Listener>();
  installIpcHandlers({
    ipcMain: { handle: (c, l) => void listeners.set(c, l), removeHandler: () => undefined },
    app: { getName: () => 'NecroAmp', getVersion: () => '4.5.6' },
    platform: options.platform ?? 'darwin',
    trusted: ['app://renderer'],
    isRegisteredSender: (s) => options.registered !== false && s === sender,
    log,
    showOpenDialog: () => Promise.resolve({ canceled: true, filePaths: [] }),
    fs: { stat: () => Promise.resolve({ isFile: () => true }) },
    path,
    registry: createMediaRegistry(),
  });
  const api = createNecroampApi((channel) => {
    const listener = listeners.get(channel);
    if (listener === undefined) return Promise.reject(new Error('no handler'));
    return listener({ senderFrame: frame, sender });
  });
  const store = createAppInfoStore(createNecroampClient({ necroamp: api }));
  render(<AppShell appInfoStore={store} />);
  return store;
}

describe('shell + bridge + main handlers', () => {
  it('shows version and platform that main reported, through every layer', async () => {
    const store = mount({ platform: 'darwin' });
    expect(await screen.findByText('4.5.6')).toBeInTheDocument();
    expect(screen.getByText('macOS')).toBeInTheDocument();
    expect(store.getState().status).toBe('loaded');
  });

  it.each([
    ['sub-frame', { parent: {} }],
    ['foreign origin', { frameUrl: 'https://evil.example/' }],
    ['unregistered sender', { registered: false }],
  ] as const)('a %s is refused by main and the shell stays usable', async (_n, options) => {
    const store = mount(options);
    const text = `${STRINGS.bridgeStatus.failed}. ${STRINGS.bridgeFailure['ipc-error']}`;
    expect(await screen.findByText(text)).toBeInTheDocument();
    expect(store.getState()).toMatchObject({
      status: 'failed',
      failure: 'ipc-error',
      data: undefined,
    });
    expect(screen.getAllByRole('region')).toHaveLength(6);
  });

  it('an unsupported platform becomes a plain failure, not a crash', async () => {
    mount({ platform: 'freebsd' });
    expect(await screen.findByText(/could not be loaded/i)).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('without a bridge the shell reports "unavailable" and still renders every region', async () => {
    const store = createAppInfoStore(createNecroampClient({}));
    render(<AppShell appInfoStore={store} />);
    expect(await screen.findByText(STRINGS.bridgeStatus.unavailable)).toBeInTheDocument();
    expect(screen.getAllByRole('region')).toHaveLength(6);
  });
});
