import { describe, expect, it, vi } from 'vitest';
import { buildMenuTemplate, installAppMenu, type MenuDescriptor } from './app-menu';

const labelsOf = (template: MenuDescriptor[]): (string | undefined)[] =>
  template.map((item) => item.label ?? item.role);

describe('buildMenuTemplate', () => {
  it('uses role menus on darwin', () => {
    expect(labelsOf(buildMenuTemplate({ platform: 'darwin', isDevRun: false }))).toEqual([
      'appMenu',
      'File',
      'editMenu',
      'windowMenu',
    ]);
  });

  it.each(['win32', 'linux', 'freebsd'])('uses File, Edit and Window on %s', (platform) => {
    const template = buildMenuTemplate({ platform, isDevRun: false });
    expect(labelsOf(template)).toEqual(['File', 'Edit', 'Window']);
    const file = template[0]?.submenu ?? [];
    expect(file.at(-1)).toEqual({ role: 'quit' });
    expect(file.map((i) => i.label)).toEqual([
      'Open Files…',
      'Open Folder…',
      undefined,
      'Clear Playlist',
      undefined,
      undefined,
    ]);
  });

  it.each(['win32', 'darwin', 'linux', 'freebsd'])(
    'shows the View menu only in a development run (%s)',
    (platform) => {
      const dev = buildMenuTemplate({ platform, isDevRun: true });
      const prod = buildMenuTemplate({ platform, isDevRun: false });
      expect(labelsOf(dev)).toContain('View');
      expect(labelsOf(prod)).not.toContain('View');
      expect(JSON.stringify(prod)).not.toMatch(/toggleDevTools|reload/);
    },
  );
});

describe('File menu commands', () => {
  const fileItems = (platform: string, onCommand = vi.fn(), clearPlaylistEnabled?: boolean) => {
    const template = buildMenuTemplate({
      platform,
      isDevRun: false,
      onCommand,
      clearPlaylistEnabled,
    });
    const file = template.find((item) => item.label === 'File');
    return { items: file?.submenu ?? [], onCommand };
  };

  it.each(['win32', 'linux', 'darwin'])('uses CommandOrControl accelerators on %s', (platform) => {
    const { items } = fileItems(platform);
    expect(items[0]?.accelerator).toBe('CommandOrControl+O');
    expect(items[1]?.accelerator).toBe('CommandOrControl+Shift+O');
  });

  it('keeps Exit (quit) on win32/linux and Close on darwin; darwin Quit lives in the app menu', () => {
    expect(fileItems('win32').items.at(-1)).toEqual({ role: 'quit' });
    expect(fileItems('linux').items.at(-1)).toEqual({ role: 'quit' });
    expect(fileItems('darwin').items.at(-1)).toEqual({ role: 'close' });
  });

  it('sends the matching command when an item is clicked', () => {
    const { items, onCommand } = fileItems('win32');
    items[0]?.click?.();
    items[1]?.click?.();
    items[3]?.click?.();
    expect(onCommand.mock.calls).toEqual([['open-files'], ['open-folder'], ['clear-playlist']]);
  });

  it('starts Clear Playlist disabled and honors the initial state', () => {
    expect(fileItems('win32').items[3]).toMatchObject({ id: 'clear-playlist', enabled: false });
    expect(fileItems('win32', vi.fn(), true).items[3]?.enabled).toBe(true);
  });

  it('does not throw when no command sink is given', () => {
    const template = buildMenuTemplate({ platform: 'linux', isDevRun: false });
    expect(() => template[0]?.submenu?.[0]?.click?.()).not.toThrow();
  });
});

describe('installAppMenu', () => {
  it('builds the template and sets it as the application menu', () => {
    const item = { enabled: false };
    const built = {
      getMenuItemById: vi.fn((id: string) => (id === 'clear-playlist' ? item : null)),
    };
    const menu = {
      buildFromTemplate: vi.fn(() => built),
      setApplicationMenu: vi.fn(),
    };
    const controller = installAppMenu(menu, { platform: 'linux', isDevRun: false });
    expect(menu.buildFromTemplate).toHaveBeenCalledTimes(1);
    expect(menu.setApplicationMenu).toHaveBeenCalledWith(built);
    controller.setClearPlaylistEnabled(true);
    expect(item.enabled).toBe(true);
    controller.setClearPlaylistEnabled(false);
    expect(item.enabled).toBe(false);
  });
});
