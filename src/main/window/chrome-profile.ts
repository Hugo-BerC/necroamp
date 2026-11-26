/**
 * Window chrome profile (design section 2, D5). Only the native profile exists. A later
 * `frameless` member must not change the security preferences, which are built separately by
 * `buildWebPreferences()` in `window-options.ts`.
 */
export type ChromeProfile = { readonly kind: 'native' };

export const NATIVE_CHROME_PROFILE: ChromeProfile = Object.freeze({ kind: 'native' });
