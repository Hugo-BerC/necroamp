/**
 * Skin roots (ADR 0008 item 2). Only the built-in root is enabled. A future third-party root is a
 * new entry here with stricter limits, not a change to the scanner.
 *
 * Packaged builds read `<resources>/skins`. Copying `skins/` into `resources` (electron-builder
 * `extraResources`) is a deferred packaging item, so until then a packaged build finds no skin
 * and runs on Foundation.
 */
export interface SkinRootInputs {
  readonly isPackaged: boolean;
  readonly appPath: string;
  /** `process.resourcesPath`. Absent outside a packaged Electron run. */
  readonly resourcesPath: string | undefined;
  readonly join: (...parts: string[]) => string;
}

export function resolveSkinRoots(inputs: SkinRootInputs): string[] {
  const { isPackaged, appPath, resourcesPath, join } = inputs;
  if (isPackaged) {
    return resourcesPath === undefined || resourcesPath === ''
      ? []
      : [join(resourcesPath, 'skins')];
  }
  return [join(appPath, 'skins')];
}
