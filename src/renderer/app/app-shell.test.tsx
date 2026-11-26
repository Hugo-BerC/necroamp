import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  createAppInfoStore,
  type AppInfoClient,
  type AppInfoClientResult,
} from '@renderer/stores/app-info-store';
import { AppShell } from './app-shell';
import { REGION_IDS } from './shell-layout';
import { STRINGS } from './strings/en';

function renderShell(result: AppInfoClientResult | Promise<AppInfoClientResult>) {
  const client: AppInfoClient = { getAppInfo: () => Promise.resolve(result) };
  const store = createAppInfoStore(client);
  return { store, ...render(<AppShell appInfoStore={store} />) };
}

const LOADED: AppInfoClientResult = {
  ok: true,
  data: { name: 'NecroAmp', version: '9.9.9', platform: 'win32' },
};

describe('AppShell structure', () => {
  it('shows one h1, the exact tagline and one labelled region per id', async () => {
    renderShell(LOADED);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('NecroAmp');
    expect(screen.getByText('Code. Listen. Repeat.')).toBeInTheDocument();
    for (const id of REGION_IDS) {
      const region = screen.getByTestId(id);
      expect(region.tagName).toBe('SECTION');
      expect(screen.getByRole('region', { name: STRINGS.regions[id] })).toBe(region);
    }
    expect(await screen.findByText('9.9.9')).toBeInTheDocument();
  });

  it('has banner and main landmarks and six sections inside main', async () => {
    renderShell(LOADED);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    const main = screen.getByRole('main');
    expect(main.querySelectorAll(':scope > section')).toHaveLength(6);
    await screen.findByText('9.9.9');
  });

  it('keeps DOM order equal to the layout order', async () => {
    renderShell(LOADED);
    const ids = screen.getAllByRole('region').map((el) => el.getAttribute('data-region'));
    expect(ids).toEqual([...REGION_IDS]);
    await screen.findByText('9.9.9');
  });

  it('uses no inline style attributes (CSP)', async () => {
    const { container } = renderShell(LOADED);
    await screen.findByText('9.9.9');
    expect(container.querySelector('[style]')).toBeNull();
  });

  it('shows ten labelled equalizer band placeholders that are not form controls', async () => {
    renderShell(LOADED);
    const eq = screen.getByTestId('equalizer');
    for (let i = 1; i <= 10; i += 1) {
      expect(within(eq).getByRole('group', { name: `Band ${i}` })).toBeInTheDocument();
    }
    expect(within(eq).queryAllByRole('slider')).toHaveLength(0);
    expect(eq.querySelectorAll('input, button')).toHaveLength(0);
    await screen.findByText('9.9.9');
  });

  it('shows spectrum and waveform panes without a canvas', async () => {
    renderShell(LOADED);
    const viz = screen.getByTestId('visualization');
    expect(viz.querySelector('[data-part="spectrum"]')).not.toBeNull();
    expect(viz.querySelector('[data-part="waveform"]')).not.toBeNull();
    expect(viz.querySelector('canvas')).toBeNull();
    await screen.findByText('9.9.9');
  });

  it('states that audio is not implemented and skins are a placeholder', async () => {
    renderShell(LOADED);
    const indicators = screen.getByRole('group', { name: STRINGS.header.statusLabel });
    expect(within(indicators).getByText(STRINGS.header.audioEngineValue)).toBeInTheDocument();
    expect(
      within(screen.getByTestId('skin-selector')).getByText(STRINGS.skins.none),
    ).toBeInTheDocument();
    await screen.findByText('9.9.9');
  });
});

describe('AppShell bridge states', () => {
  it('shows version and platform when loaded', async () => {
    renderShell(LOADED);
    expect(await screen.findByText('Windows')).toBeInTheDocument();
    expect(screen.getByText('9.9.9')).toBeInTheDocument();
    expect(screen.getAllByRole('status')[0]).toHaveTextContent(STRINGS.bridgeStatus.loaded);
  });

  it('shows the unavailable state and still renders every region', async () => {
    renderShell({ ok: false, reason: 'unavailable' });
    expect(await screen.findByText(STRINGS.bridgeStatus.unavailable)).toBeInTheDocument();
    for (const id of REGION_IDS) {
      expect(screen.getByTestId(id)).toBeInTheDocument();
    }
  });

  it.each(['rejected', 'invalid-response', 'ipc-error'] as const)(
    'shows a plain failure for %s',
    async (reason) => {
      renderShell({ ok: false, reason });
      const text = `${STRINGS.bridgeStatus.failed}. ${STRINGS.bridgeFailure[reason]}`;
      expect(await screen.findByText(text)).toBeInTheDocument();
    },
  );

  it('shows the loading state before the client resolves', () => {
    const store = createAppInfoStore({ getAppInfo: () => new Promise(() => undefined) });
    render(<AppShell appInfoStore={store} />);
    expect(screen.getAllByRole('status')[0]).toHaveTextContent(STRINGS.bridgeStatus.loading);
  });

  it('loads only once under StrictMode', async () => {
    let calls = 0;
    const store = createAppInfoStore({
      getAppInfo: () => {
        calls += 1;
        return Promise.resolve(LOADED);
      },
    });
    const { StrictMode } = await import('react');
    render(
      <StrictMode>
        <AppShell appInfoStore={store} />
      </StrictMode>,
    );
    await screen.findByText('9.9.9');
    expect(calls).toBe(1);
  });
});

describe('AppShell placeholder controls', () => {
  it('lists the five transport controls as unavailable but focusable', async () => {
    renderShell(LOADED);
    const transport = screen.getByRole('group', { name: STRINGS.player.transport });
    const buttons = within(transport).getAllByRole('button');
    expect(buttons.map((b) => b.textContent)).toEqual([
      'Previous',
      'Play',
      'Pause',
      'Stop',
      'Next',
    ]);
    for (const button of buttons) {
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).not.toBeDisabled();
      expect(button).toHaveAccessibleDescription(STRINGS.notImplemented);
    }
    await screen.findByText('9.9.9');
  });

  it('updates the region status text on activation and changes nothing else', async () => {
    renderShell(LOADED);
    await screen.findByText('9.9.9');
    const player = screen.getByTestId('player');
    const status = within(player).getByRole('status');
    expect(status).toBeEmptyDOMElement();
    await userEvent.click(within(player).getByRole('button', { name: 'Play' }));
    expect(status).toHaveTextContent('Play: not implemented in this phase.');
    expect(within(player).getByText(STRINGS.player.noTrack)).toBeInTheDocument();
  });

  it('is operable by keyboard in DOM order', async () => {
    renderShell(LOADED);
    await screen.findByText('9.9.9');
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Previous' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(within(screen.getByTestId('player')).getByRole('status')).toHaveTextContent(
      'Previous: not implemented in this phase.',
    );
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Play' })).toHaveFocus();
  });

  it.each([
    ['playlist', STRINGS.playlist.addFiles],
    ['skin-selector', STRINGS.skins.choose],
    ['github', STRINGS.github.signIn],
  ] as const)('%s placeholder activation updates its status', async (id, label) => {
    renderShell(LOADED);
    await screen.findByText('9.9.9');
    const region = screen.getByTestId(id);
    await userEvent.click(within(region).getByRole('button', { name: label }));
    expect(within(region).getByRole('status')).toHaveTextContent(STRINGS.activationMessage(label));
  });
});
