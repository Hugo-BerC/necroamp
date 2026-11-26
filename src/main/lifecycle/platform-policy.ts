/** Pure platform lifecycle policy (design section 6, R7.3, R16.1). */
export type SupportedPlatform = 'win32' | 'darwin' | 'linux';

/** Every platform except macOS quits when the last window closes. Unknown platforms quit. */
export const shouldQuitOnAllWindowsClosed = (platform: string): boolean => platform !== 'darwin';

/** Only macOS keeps running without windows, so only macOS recreates one on activate. */
export const shouldCreateWindowOnActivate = (platform: string, openWindows: number): boolean =>
  platform === 'darwin' && openWindows === 0;
