import type { MenuItemConstructorOptions } from 'electron';

/**
 * Menu template builder (design section 6, D6, R16.6). Roles supply localized labels. The View
 * menu with reload and DevTools exists only in a development run.
 */
export interface MenuDescriptor {
  role?:
    | 'appMenu'
    | 'fileMenu'
    | 'editMenu'
    | 'windowMenu'
    | 'quit'
    | 'undo'
    | 'redo'
    | 'cut'
    | 'copy'
    | 'paste'
    | 'selectAll'
    | 'minimize'
    | 'close'
    | 'reload'
    | 'toggleDevTools';
  label?: string;
  type?: 'separator';
  submenu?: MenuDescriptor[];
}

export interface MenuOptions {
  readonly platform: string;
  readonly isDevRun: boolean;
}

const EDIT_SUBMENU: MenuDescriptor[] = [
  { role: 'undo' },
  { role: 'redo' },
  { type: 'separator' },
  { role: 'cut' },
  { role: 'copy' },
  { role: 'paste' },
  { role: 'selectAll' },
];

export function buildMenuTemplate({ platform, isDevRun }: MenuOptions): MenuDescriptor[] {
  const template: MenuDescriptor[] =
    platform === 'darwin'
      ? [{ role: 'appMenu' }, { role: 'fileMenu' }, { role: 'editMenu' }]
      : [
          { label: 'File', submenu: [{ role: 'quit' }] },
          { label: 'Edit', submenu: EDIT_SUBMENU },
        ];
  if (isDevRun) {
    template.push({
      label: 'View',
      submenu: [{ role: 'reload' }, { role: 'toggleDevTools' }],
    });
  }
  template.push(
    platform === 'darwin'
      ? { role: 'windowMenu' }
      : { label: 'Window', submenu: [{ role: 'minimize' }, { role: 'close' }] },
  );
  return template;
}

/** Thin adapter. The real `Menu` class is passed in by the composition root. */
export function installAppMenu<M>(
  menu: {
    buildFromTemplate(template: MenuItemConstructorOptions[]): M;
    setApplicationMenu(menu: M): void;
  },
  options: MenuOptions,
): void {
  menu.setApplicationMenu(menu.buildFromTemplate(buildMenuTemplate(options)));
}
