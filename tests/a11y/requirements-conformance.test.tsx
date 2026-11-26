import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AppShell } from '@renderer/app/app-shell';
import { createAppInfoStore } from '@renderer/stores/app-info-store';

// R8 conformance of the visible shell against .kiro/specs/desktop-foundation/requirements.md.
// Defects 0002-0004 (docs/testing/defects/) are fixed, so these are normal tests. A test for a known
// open defect uses `it.fails` and must be switched to `it` in the same change as the fix.
async function shell() {
  const store = createAppInfoStore({
    getAppInfo: () =>
      Promise.resolve({
        ok: true as const,
        data: { name: 'NecroAmp', version: '1.0.0', platform: 'linux' as const },
      }),
  });
  render(<AppShell appInfoStore={store} />);
  await store.getState().load();
  return store;
}

describe('R8 placeholders', () => {
  it('R8.4: Previous, Play, Pause, Stop and Next exist, make no change and show a not-implemented note', async () => {
    const user = userEvent.setup();
    await shell();
    const player = within(screen.getByTestId('player'));
    for (const name of ['Previous', 'Play', 'Pause', 'Stop', 'Next']) {
      const button = player.getByRole('button', { name });
      await user.click(button);
      expect(button).toHaveAttribute('aria-disabled', 'true');
    }
    expect(player.getAllByText(/not implemented in this phase/i).length).toBeGreaterThan(0);
    expect(player.getByText('No track loaded')).toBeInTheDocument();
  });

  it('R8.6: ten inert band placeholders labelled Band 1 to Band 10', async () => {
    await shell();
    const eq = within(screen.getByTestId('equalizer'));
    for (let i = 1; i <= 10; i += 1)
      expect(eq.getByRole('group', { name: `Band ${i}` })).toBeInTheDocument();
    expect(eq.queryAllByRole('slider')).toHaveLength(0);
  });

  it('R8.9 (partial): the GitHub region states that the integration is optional and has an inert sign-in', async () => {
    await shell();
    const github = within(screen.getByTestId('github'));
    expect(github.getByText(/features are optional/i)).toBeInTheDocument();
    expect(github.getByRole('button', { name: /sign in/i })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  // Defect 0002: R8.5, the playlist has no list element for future items.
  it('R8.5: the playlist region contains a heading, an empty-state message and a list element', async () => {
    await shell();
    const playlist = within(screen.getByTestId('playlist'));
    expect(playlist.getByRole('heading')).toBeInTheDocument();
    expect(playlist.getByText(/empty/i)).toBeInTheDocument();
    expect(playlist.getByRole('list')).toBeInTheDocument();
  });

  // Defect 0003: R8.8, there is no "Foundation default" entry.
  it('R8.8: the skin region shows a single non-functional "Foundation default" entry', async () => {
    await shell();
    expect(
      within(screen.getByTestId('skin-selector')).getByText('Foundation default'),
    ).toBeInTheDocument();
  });

  // Defect 0004: R8.9, the text never says that the user is not signed in.
  it('R8.9: the GitHub region says the integration is optional and not signed in', async () => {
    await shell();
    expect(within(screen.getByTestId('github')).getByText(/not signed in/i)).toBeInTheDocument();
  });
});
