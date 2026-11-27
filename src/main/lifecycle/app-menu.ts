import type { MenuItemConstructorOptions } from 'electron';
import type { MENU_COMMANDS } from '@shared/ipc';

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
  id?: string;
  accelerator?: string;
  enabled?: boolean;
  type?: 'separator';
  click?: () => void;
  submenu?: MenuDescriptor[];
}

export interface MenuOptions {
  readonly platform: string;
  readonly isDevRun: boolean;
  /** Called when the user picks a File menu command. Absent in tests that only inspect labels. */
  readonly onCommand?: (command: MenuCommandName) => void;
  /** Initial enabled state of "Clear Playlist". Defaults to false (an empty playlist). */
  readonly clearPlaylistEnabled?: boolean;
}

export type MenuCommandName = (typeof MENU_COMMANDS)[number];

export const CLEAR_PLAYLIST_MENU_ID = 'clear-playlist';

const EDIT_SUBMENU: MenuDescriptor[] = [
  { role: 'undo' },
  { role: 'redo' },
  { type: 'separator' },
  { role: 'cut' },
  { role: 'copy' },
  { role: 'paste' },
  { role: 'selectAll' },
];

/** Open Files, Open Folder and Clear Playlist. Accelerators use CommandOrControl (Cmd on macOS). */
function libraryItems({ onCommand, clearPlaylistEnabled }: MenuOptions): MenuDescriptor[] {
  const send = (command: MenuCommandName) => (): void => onCommand?.(command);
  return [
    { label: 'Open Files…', accelerator: 'CommandOrControl+O', click: send('open-files') },
    { label: 'Open Folder…', accelerator: 'CommandOrControl+Shift+O', click: send('open-folder') },
    { type: 'separator' },
    {
      id: CLEAR_PLAYLIST_MENU_ID,
      label: 'Clear Playlist',
      enabled: clearPlaylistEnabled ?? false,
      click: send('clear-playlist'),
    },
  ];
}

export function buildMenuTemplate(options: MenuOptions): MenuDescriptor[] {
  const { platform, isDevRun } = options;
  const template: MenuDescriptor[] =
    platform === 'darwin'
      ? [
          { role: 'appMenu' },
          {
            label: 'File',
            submenu: [...libraryItems(options), { type: 'separator' }, { role: 'close' }],
          },
          { role: 'editMenu' },
        ]
      : [
          {
            label: 'File',
            submenu: [...libraryItems(options), { type: 'separator' }, { role: 'quit' }],
          },
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

export interface AppMenuController {
  /** Enables or disables "Clear Playlist" on the installed menu. */
  setClearPlaylistEnabled(enabled: boolean): void;
}

interface MenuLike<M> {
  buildFromTemplate(template: MenuItemConstructorOptions[]): M;
  setApplicationMenu(menu: M | null): void;
}

/** Thin adapter. The real Menu class is passed in by the composition root. */
export function installAppMenu<
  M extends { getMenuItemById(id: string): { enabled: boolean } | null },
>(menu: MenuLike<M>, options: MenuOptions): AppMenuController {
  const built = menu.buildFromTemplate(buildMenuTemplate(options) as MenuItemConstructorOptions[]);
  menu.setApplicationMenu(built);
  return {
    setClearPlaylistEnabled(enabled) {
      const item = built.getMenuItemById(CLEAR_PLAYLIST_MENU_ID);
      if (item !== null) item.enabled = enabled;
    },
  };
}
