import { expect, test } from './fixtures/launch';

// Native application menu smoke (PR #7). Reads the real menu in the main process. The native
// dialogs are never opened here, so the test stays headless and deterministic.
interface FlatItem {
  readonly label: string;
  readonly role: string | null;
  readonly accelerator: string | null;
  readonly enabled: boolean;
  readonly id: string;
  readonly type: string;
}

test.describe('native application menu', () => {
  test('File menu has the audio items and Clear Playlist follows the playlist state', async ({
    app,
    page,
  }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const readFile = (): Promise<FlatItem[]> =>
      app.evaluate(({ Menu }) => {
        const menu = Menu.getApplicationMenu();
        const file = menu?.items.find((item) => item.label === 'File');
        return (file?.submenu?.items ?? []).map((item) => ({
          label: item.label,
          role: item.role ?? null,
          accelerator: item.accelerator === undefined ? null : String(item.accelerator),
          enabled: item.enabled,
          id: item.id,
          type: item.type,
        }));
      });

    const items = (await readFile()).filter((i) => i.type !== 'separator');
    const labels = items.map((i) => i.label);
    expect(labels).toContain('Open Files…');
    expect(labels).toContain('Open Folder…');
    expect(labels).toContain('Clear Playlist');
    expect(items.find((i) => i.label === 'Open Files…')?.accelerator).toBe('CommandOrControl+O');
    expect(items.find((i) => i.label === 'Open Folder…')?.accelerator).toBe(
      'CommandOrControl+Shift+O',
    );
    // Exit on Windows and Linux (quit role). macOS puts Quit in the app menu instead.
    if (process.platform !== 'darwin') {
      expect(items.some((i) => i.role === 'quit')).toBe(true);
    }

    // The empty playlist at startup keeps Clear Playlist disabled.
    expect(items.find((i) => i.label === 'Clear Playlist')?.enabled).toBe(false);

    // The renderer reports through the validated bridge. Main flips the menu item.
    const enabled = await page.evaluate(() =>
      window.necroamp.menu.reportPlaylistState({ hasTracks: true }),
    );
    expect(enabled).toEqual({ ok: true, data: { applied: true } });
    await expect
      .poll(async () => (await readFile()).find((i) => i.id === 'clear-playlist')?.enabled)
      .toBe(true);

    await page.evaluate(() => window.necroamp.menu.reportPlaylistState({ hasTracks: false }));
    await expect
      .poll(async () => (await readFile()).find((i) => i.id === 'clear-playlist')?.enabled)
      .toBe(false);
  });

  test('the bridge rejects malformed menu state and exposes no raw IPC', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const result = await page.evaluate(async () => {
      const api = window.necroamp as unknown as {
        menu: { reportPlaylistState(state: unknown): Promise<unknown> };
      };
      return {
        bad: await api.menu.reportPlaylistState({ hasTracks: 'yes' }),
        keys: Object.keys(window.necroamp).sort(),
        menuKeys: Object.keys(window.necroamp.menu).sort(),
        hasIpcRenderer: 'ipcRenderer' in window,
      };
    });
    expect(result.bad).toMatchObject({ ok: false, error: { code: 'INVALID_PAYLOAD' } });
    expect(result.keys).toEqual(['app', 'library', 'menu', 'playlist']);
    expect(result.menuKeys).toEqual(['onCommand', 'reportPlaylistState']);
    expect(result.hasIpcRenderer).toBe(false);
  });
});
