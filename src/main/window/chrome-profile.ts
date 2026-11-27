/**
 * Window chrome profile (ADR 0009). `native` keeps the OS frame. `frameless` lets the trusted
 * renderer title bar draw the decoration. Neither profile changes the security preferences, which
 * `buildWebPreferences()` in `window-options.ts` builds separately.
 */
export type ChromeProfile = { readonly kind: 'native' } | { readonly kind: 'frameless' };

export const NATIVE_CHROME_PROFILE: ChromeProfile = Object.freeze({ kind: 'native' });
export const FRAMELESS_CHROME_PROFILE: ChromeProfile = Object.freeze({ kind: 'frameless' });
