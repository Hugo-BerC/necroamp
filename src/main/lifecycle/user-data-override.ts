import type { PlatformPath } from 'node:path';

/**
 * Test-only user-data isolation (design section 6, R13.5). The override is inert in a packaged
 * build. The value must be a short absolute path to an existing directory.
 */
export const E2E_USER_DATA_ENV = 'NECROAMP_E2E_USER_DATA';
export const MAX_USER_DATA_PATH_LENGTH = 260;

export type UserDataOverrideResult =
  | { readonly status: 'absent' }
  | { readonly status: 'ignored'; readonly code: 'PACKAGED' | 'INVALID' }
  | { readonly status: 'applied'; readonly path: string };

export interface DirectoryProbe {
  isDirectory(path: string): boolean;
}

export function resolveUserDataOverride(
  value: unknown,
  isPackaged: boolean,
  pathApi: Pick<PlatformPath, 'isAbsolute' | 'normalize'>,
  probe: DirectoryProbe,
): UserDataOverrideResult {
  if (value === undefined) return { status: 'absent' };
  if (isPackaged) return { status: 'ignored', code: 'PACKAGED' };
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > MAX_USER_DATA_PATH_LENGTH ||
    value.includes('\0') ||
    !pathApi.isAbsolute(value) ||
    pathApi.normalize(value) !== value
  ) {
    return { status: 'ignored', code: 'INVALID' };
  }
  try {
    if (!probe.isDirectory(value)) return { status: 'ignored', code: 'INVALID' };
  } catch {
    return { status: 'ignored', code: 'INVALID' };
  }
  return { status: 'applied', path: value };
}
