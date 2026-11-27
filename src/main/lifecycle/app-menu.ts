import type { MenuItemConstructorOptions } from 'electron';
import type { MENU_COMMANDS } from '@shared/ipc';

/**
 * Menu template builder (design section 6, D6, R16.6). Roles supply localized labels. The View
 * menu always exists (ADR 0009 item 3): a `Skin` radio submenu and `Skins…`. Reload and DevTools
 * are added to it only in a development run.
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
  type?: 'separator' | 'radio';
  checked?: boolean;
  click?: () => void;
  submenu?: MenuDescriptor[];
}

export interface SkinMenuItem {
  readonly id: string;
  readonly name: string;
  readonly enabled: boolean;
}

export interface MenuOptions {
  readonly platform: string;
  readonly isDevRun: boolean;
  /** Called when the user picks a File menu command. Absent in tests that only inspect labels. */
  readonly onCommand?: (command: MenuCommandName) => void;
  /** Initial enabled state of "Clear Playlist". Defaults to false (an empty playlist). */
  readonly clearPlaylistEnabled?: boolean;
  /** Skins offered in View > Skin. Defaults to Foundation only. */
  readonly skins?: readonly SkinMenuItem[];
  readonly activeSkinId?: string;
  /** Called when the user picks a skin radio item. */
  readonly onSelectSkin?: (skinId: string) => void;
}

export type MenuCommandName = (typeof MENU_COMMANDS)[number];

export const CLEAR_PLAYLIST_MENU_ID = 'clear-playlist';
export const SKIN_MENU_ID_PREFIX = 'skin:';
const DEFAULT_SKINS: readonly SkinMenuItem[] = [
  { id: 'foundation', name: 'Foundation', enabled: true },
];

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

/** View > Skin (radio items), `Skins…`, then the development-only reload and DevTools. */
function viewMenu(options: MenuOptions): MenuDescriptor {
  const { onCommand, onSelectSkin, isDevRun } = options;
  const skins = options.skins ?? DEFAULT_SKINS;
  const activeId = options.activeSkinId ?? 'foundation';
  const submenu: MenuDescriptor[] = [
    {
      label: 'Skin',
      submenu: skins.map((skin): MenuDescriptor => ({
        id: `${SKIN_MENU_ID_PREFIX}${skin.id}`,
        label: skin.name,
        type: 'radio',
        checked: skin.id === activeId,
        enabled: skin.enabled,
        click: () => onSelectSkin?.(skin.id),
      })),
    },
    { type: 'separator' },
    { label: 'Skins…', click: () => onCommand?.('open-skin-picker') },
  ];
  if (isDevRun) {
    submenu.push({ type: 'separator' }, { role: 'reload' }, { role: 'toggleDevTools' });
  }
  return { label: 'View', submenu };
}

export function buildMenuTemplate(options: MenuOptions): MenuDescriptor[] {
  const { platform } = options;
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
  template.push(viewMenu(options));
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
  /** Checks the radio item of the active skin. */
  setActiveSkin(skinId: string): void;
}

interface MenuLike<M> {
  buildFromTemplate(template: MenuItemConstructorOptions[]): M;
  setApplicationMenu(menu: M | null): void;
}

interface MenuItemLike {
  enabled: boolean;
  checked?: boolean;
}

/** Thin adapter. The real Menu class is passed in by the composition root. */
export function installAppMenu<M extends { getMenuItemById(id: string): MenuItemLike | null }>(
  menu: MenuLike<M>,
  options: MenuOptions,
): AppMenuController {
  const built = menu.buildFromTemplate(buildMenuTemplate(options) as MenuItemConstructorOptions[]);
  menu.setApplicationMenu(built);
  return {
    setClearPlaylistEnabled(enabled) {
      const item = built.getMenuItemById(CLEAR_PLAYLIST_MENU_ID);
      if (item !== null) item.enabled = enabled;
    },
    setActiveSkin(skinId) {
      const item = built.getMenuItemById(`${SKIN_MENU_ID_PREFIX}${skinId}`);
      if (item !== null) item.checked = true;
    },
  };
}
