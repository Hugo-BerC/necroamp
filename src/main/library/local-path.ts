/** Platforms with distinct absolute-path rules. Other Node platforms follow the posix rules. */
export type PathPlatform = NodeJS.Platform;

export const MAX_LOCAL_PATH_LENGTH = 4096;

// C0 controls (including NUL), DEL and C1 controls.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/;
const WINDOWS_DRIVE_ABSOLUTE = /^[A-Za-z]:\\/;
// Never valid inside a Windows path after the drive prefix. Rejects alternate data streams too.
const WINDOWS_FORBIDDEN = /[<>:"|?*]/;

/**
 * Pure syntax check for persisted playlist restoration. Accepts only a local absolute file path
 * and performs no filesystem access, so a rejected value can never cause disk or network I/O.
 *
 * win32: only `X:\...` or `X:/...` is accepted. UNC (`\\host\share`, `//host/share`), the device
 * namespace (`\\?\`, `\\.\`), drive-relative (`C:foo`) and root-relative (`\foo`) are rejected.
 * posix: only a path starting with a single `/` is accepted; a leading `//` is rejected.
 *
 * Limitation: network-hosted tracks (UNC shares) are not restored automatically. Full network
 * library support is outside the MVP scope. This check is not applied to paths the user picks
 * in the open dialogs.
 */
export function isLocalAbsolutePath(path: unknown, platform: PathPlatform): boolean {
  if (typeof path !== 'string') return false;
  if (path.length === 0 || path.length > MAX_LOCAL_PATH_LENGTH) return false;
  if (CONTROL_CHARACTERS.test(path)) return false;
  if (platform === 'win32') {
    const normalized = path.replace(/\//g, '\\');
    if (!WINDOWS_DRIVE_ABSOLUTE.test(normalized)) return false;
    return !WINDOWS_FORBIDDEN.test(normalized.slice(2));
  }
  return path.startsWith('/') && !path.startsWith('//');
}
