import { describe, expect, it, vi } from 'vitest';
import { buildMenuTemplate, installAppMenu, type MenuDescriptor } from './app-menu';

const labelsOf = (template: MenuDescriptor[]): (string | undefined)[] =>
  template.map((item) => item.label ?? item.role);

describe('buildMenuTemplate', () => {
  it('uses role menus on darwin', () => {
    expect(labelsOf(buildMenuTemplate({ platform: 'darwin', isDevRun: false }))).toEqual([
      'appMenu',
      'fileMenu',
      'editMenu',
      'windowMenu',
    ]);
  });

  it.each(['win32', 'linux', 'freebsd'])('uses File, Edit and Window on %s', (platform) => {
    const template = buildMenuTemplate({ platform, isDevRun: false });
    expect(labelsOf(template)).toEqual(['File', 'Edit', 'Window']);
    expect(template[0]?.submenu).toEqual([{ role: 'quit' }]);
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

describe('installAppMenu', () => {
  it('builds the template and sets it as the application menu', () => {
    const built = { id: 'menu' };
    const menu = {
      buildFromTemplate: vi.fn(() => built),
      setApplicationMenu: vi.fn(),
    };
    installAppMenu(menu, { platform: 'linux', isDevRun: false });
    expect(menu.buildFromTemplate).toHaveBeenCalledTimes(1);
    expect(menu.setApplicationMenu).toHaveBeenCalledWith(built);
  });
});
