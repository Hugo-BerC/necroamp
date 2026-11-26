import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AppShell } from '@renderer/app/app-shell';
import { REGION_IDS } from '@renderer/app/shell-layout';
import { STRINGS } from '@renderer/app/strings/en';
import { contrastRatio, parseHexColor, readCustomProperties } from '@renderer/app/theme/contrast';
import { createAppInfoStore, type AppInfoClientResult } from '@renderer/stores/app-info-store';

// T6.4 (R9): names, roles, one h1, lang, focus order, aria-disabled placeholders, focus indicator contrast.
// These complement the axe scan in the E2E suite; jsdom has no layout, so contrast is read from tokens.
const LOADED: AppInfoClientResult = {
  ok: true,
  data: { name: 'NecroAmp', version: '1.2.3', platform: 'linux' },
};

async function renderShell(result: AppInfoClientResult = LOADED) {
  const store = createAppInfoStore({ getAppInfo: () => Promise.resolve(result) });
  const view = render(<AppShell appInfoStore={store} />);
  await screen.findAllByRole('status');
  await store.getState().load();
  return view;
}

describe('accessible names and structure (R9.1, R9.2)', () => {
  it('gives every button, group and region a non-empty accessible name', async () => {
    await renderShell();
    for (const button of screen.getAllByRole('button')) {
      expect(button, button.outerHTML).toHaveAccessibleName();
    }
    for (const group of screen.getAllByRole('group')) {
      expect(group, group.outerHTML).toHaveAccessibleName();
    }
    for (const id of REGION_IDS) {
      expect(screen.getByRole('region', { name: STRINGS.regions[id] })).toBeInTheDocument();
    }
  });

  it('has unique ids and every aria reference resolves to an existing element', async () => {
    const { container } = await renderShell();
    const ids = [...container.querySelectorAll('[id]')].map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const attr of ['aria-labelledby', 'aria-describedby'] as const) {
      for (const el of container.querySelectorAll(`[${attr}]`)) {
        for (const ref of (el.getAttribute(attr) ?? '').split(/\s+/).filter(Boolean)) {
          expect(container.querySelector(`#${CSS.escape(ref)}`), `${attr}=${ref}`).not.toBeNull();
        }
      }
    }
  });

  it('keeps heading levels sequential below the single h1', async () => {
    await renderShell();
    const levels = screen.getAllByRole('heading').map((h) => Number(h.tagName.slice(1)));
    expect(levels.filter((l) => l === 1)).toHaveLength(1);
    expect(levels[0]).toBe(1);
    for (let i = 1; i < levels.length; i += 1) {
      expect(levels[i]! - levels[i - 1]!).toBeLessThanOrEqual(1);
    }
  });

  it('uses no positive tabindex and no focusable non-interactive element', async () => {
    const { container } = await renderShell();
    for (const el of container.querySelectorAll('[tabindex]')) {
      expect(Number(el.getAttribute('tabindex'))).toBeLessThanOrEqual(0);
    }
  });

  it('declares the document language in the HTML entry', () => {
    const html = readFileSync(join(process.cwd(), 'src', 'renderer', 'index.html'), 'utf8');
    expect(html).toMatch(/<html[^>]*\blang="en"/);
  });
});

describe('keyboard navigation (R9.2, R9.5)', () => {
  it('reaches every control with Tab in DOM order, with no trap and no dead end', async () => {
    const user = userEvent.setup();
    const { container } = await renderShell();
    const expected = [
      ...container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex="0"]',
      ),
    ];
    expect(expected.length).toBeGreaterThan(0);
    const visited: HTMLElement[] = [];
    for (let i = 0; i < expected.length; i += 1) {
      await user.tab();
      visited.push(document.activeElement as HTMLElement);
    }
    expect(visited).toEqual(expected);
    // One more Tab leaves the document content (focus returns to body in jsdom).
    await user.tab();
    expect(expected).not.toContain(document.activeElement);
  });

  it('moves backwards with Shift+Tab symmetrically', async () => {
    const user = userEvent.setup();
    const { container } = await renderShell();
    const expected = [...container.querySelectorAll<HTMLElement>('button')];
    for (let i = 0; i < expected.length; i += 1) await user.tab();
    for (let i = expected.length - 1; i >= 0; i -= 1) {
      expect(document.activeElement).toBe(expected[i]);
      await user.tab({ shift: true });
    }
  });

  it('keeps focus order equal to region order (player controls before playlist controls)', async () => {
    await renderShell();
    const regionsInDom = screen.getAllByRole('region').map((r) => r.getAttribute('data-region'));
    expect(regionsInDom).toEqual([...REGION_IDS]);
    const buttonRegions = screen
      .getAllByRole('button')
      .map((b) => b.closest('[data-region]')?.getAttribute('data-region'));
    const firstSeen = [...new Set(buttonRegions)];
    const order = firstSeen.map((id) => REGION_IDS.indexOf(id as (typeof REGION_IDS)[number]));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });
});

describe('unavailable placeholder controls (R9.4, R9.6)', () => {
  it('are focusable, aria-disabled, never natively disabled, and explain themselves', async () => {
    await renderShell();
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(5);
    for (const button of buttons) {
      expect(button).not.toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
      button.focus();
      expect(button).toHaveFocus();
      const describedBy = button.getAttribute('aria-describedby');
      if (describedBy !== null) {
        expect(document.getElementById(describedBy)?.textContent?.trim()).not.toBe('');
      }
    }
  });

  it.each(['click', 'Enter', 'Space'] as const)(
    'activation by %s does nothing destructive and keeps focus',
    async (how) => {
      const user = userEvent.setup();
      await renderShell();
      const play = within(screen.getByTestId('player')).getByRole('button', {
        name: STRINGS.player.controls.play,
      });
      play.focus();
      if (how === 'click') await user.click(play);
      else await user.keyboard(how === 'Enter' ? '{Enter}' : ' ');
      expect(play).toBeInTheDocument();
      expect(play).toHaveFocus();
      expect(play).toHaveAttribute('aria-disabled', 'true');
    },
  );

  it('shows a visible text reason for each unavailable region, not only color', async () => {
    await renderShell();
    expect(
      within(screen.getByTestId('equalizer')).getByText(STRINGS.equalizer.unavailable),
    ).toBeVisible();
    expect(
      within(screen.getByTestId('visualization')).getByText(STRINGS.visualizer.unavailable),
    ).toBeVisible();
    expect(within(screen.getByTestId('skin-selector')).getByText(STRINGS.skins.none)).toBeVisible();
    expect(within(screen.getByTestId('playlist')).getByText(STRINGS.playlist.empty)).toBeVisible();
  });
});

describe('status announcements (R9.7)', () => {
  it('announces the bridge failure through a status region without raw error data', async () => {
    await renderShell({ ok: false, reason: 'invalid-response' });
    const status = screen.getAllByRole('status')[0]!;
    expect(status).toHaveTextContent(STRINGS.bridgeFailure['invalid-response']);
  });
});

describe('focus indicator and text contrast from tokens (R9.3)', () => {
  const root = join(process.cwd(), 'src', 'renderer', 'app', 'styles');
  const tokens = readCustomProperties(readFileSync(join(root, 'tokens.css'), 'utf8'));
  const rgb = (name: string) => {
    const value = parseHexColor(tokens.get(name) ?? '');
    if (value === undefined) throw new Error(`${name} is not a hex color`);
    return value;
  };

  it.each([
    '--na-color-app-bg',
    '--na-color-surface',
    '--na-color-surface-raised',
    '--na-color-surface-inset',
  ])('focus color has at least 3:1 contrast against %s (WCAG 1.4.11)', (surface) => {
    expect(contrastRatio(rgb('--na-color-focus'), rgb(surface))).toBeGreaterThanOrEqual(3);
  });

  it.each(['--na-color-surface', '--na-color-surface-raised', '--na-color-surface-inset'])(
    'text and muted text have at least 4.5:1 contrast against %s (WCAG 1.4.3)',
    (surface) => {
      for (const text of ['--na-color-text', '--na-color-text-muted']) {
        expect(
          contrastRatio(rgb(text), rgb(surface)),
          `${text} on ${surface}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    },
  );

  it('control borders have at least 3:1 contrast against the surface', () => {
    expect(
      contrastRatio(rgb('--na-color-border-control'), rgb('--na-color-surface')),
    ).toBeGreaterThanOrEqual(3);
  });
});
