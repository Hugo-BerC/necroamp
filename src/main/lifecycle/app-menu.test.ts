import { describe, expect, it, vi } from 'vitest';
import {
  buildMenuTemplate,
  installAppMenu,
  type MenuDescriptor,
  type MenuOptions,
} from './app-menu';

const labelsOf = (template: MenuDescriptor[]): (string | undefined)[] =>
  template.map((item) => item.label ?? item.role);

describe('buildMenuTemplate', () => {
  it('uses role menus on darwin', () => {
    expect(labelsOf(buildMenuTemplate({ platform: 'darwin', isDevRun: false }))).toEqual([
      'appMenu',
      'File',
      'editMenu',
      'View',
      'windowMenu',
    ]);
  });

  it.each(['win32', 'linux', 'freebsd'])('uses File, Edit, View and Window on %s', (platform) => {
    const template = buildMenuTemplate({ platform, isDevRun: false });
    expect(labelsOf(template)).toEqual(['File', 'Edit', 'View', 'Window']);
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
    'always has a View menu; reload and DevTools exist only in a development run (%s)',
    (platform) => {
      const dev = buildMenuTemplate({ platform, isDevRun: true });
      const prod = buildMenuTemplate({ platform, isDevRun: false });
      expect(labelsOf(dev)).toContain('View');
      expect(labelsOf(prod)).toContain('View');
      expect(JSON.stringify(prod)).not.toMatch(/toggleDevTools|reload/);
      expect(JSON.stringify(dev)).toMatch(/toggleDevTools/);
    },
  );
});

describe('View > Skin', () => {
  const view = (options: Partial<MenuOptions> = {}) => {
    const template = buildMenuTemplate({ platform: 'win32', isDevRun: false, ...options });
    return template.find((item) => item.label === 'View')?.submenu ?? [];
  };

  it('offers Foundation as the only skin when none is given', () => {
    const skin = view()[0];
    expect(skin?.label).toBe('Skin');
    expect(skin?.submenu).toEqual([
      expect.objectContaining({
        id: 'skin:foundation',
        label: 'Foundation',
        type: 'radio',
        checked: true,
        enabled: true,
      }),
    ]);
  });

  it('lists every skin as a radio item, checks the active one and disables unusable skins', () => {
    const items =
      view({
        skins: [
          { id: 'foundation', name: 'Foundation', enabled: true },
          { id: 'morgul-revenant', name: 'Morgul Revenant', enabled: true },
          { id: 'broken', name: 'Broken', enabled: false },
        ],
        activeSkinId: 'morgul-revenant',
      })[0]?.submenu ?? [];
    expect(items.map((i) => [i.id, i.checked, i.enabled])).toEqual([
      ['skin:foundation', false, true],
      ['skin:morgul-revenant', true, true],
      ['skin:broken', false, false],
    ]);
  });

  it('selects a skin by id and opens the picker through the command channel', () => {
    const onSelectSkin = vi.fn();
    const onCommand = vi.fn();
    const items = view({ onSelectSkin, onCommand });
    items[0]?.submenu?.[0]?.click?.();
    expect(onSelectSkin).toHaveBeenCalledWith('foundation');
    const picker = items.find((i) => i.label === 'Skins…');
    picker?.click?.();
    expect(onCommand).toHaveBeenCalledWith('open-skin-picker');
  });

  it('does not throw without sinks', () => {
    const items = view();
    expect(() => items[0]?.submenu?.[0]?.click?.()).not.toThrow();
    expect(() => items.at(-1)?.click?.()).not.toThrow();
  });

  it('keeps the native File menu in every configuration', () => {
    for (const platform of ['win32', 'linux', 'darwin']) {
      const template = buildMenuTemplate({ platform, isDevRun: false });
      const file = template.find((item) => item.label === 'File');
      expect(file?.submenu?.[0]?.label).toBe('Open Files…');
    }
  });
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

  it('checks the radio item of the active skin and ignores unknown ids', () => {
    const item: { enabled: boolean; checked?: boolean } = { enabled: true };
    const built = {
      getMenuItemById: vi.fn((id: string) => (id === 'skin:morgul-revenant' ? item : null)),
    };
    const menu = { buildFromTemplate: vi.fn(() => built), setApplicationMenu: vi.fn() };
    const controller = installAppMenu(menu, { platform: 'win32', isDevRun: false });
    controller.setActiveSkin('morgul-revenant');
    expect(item.checked).toBe(true);
    expect(() => controller.setActiveSkin('nope')).not.toThrow();
  });
});
