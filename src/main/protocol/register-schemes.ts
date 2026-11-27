import { APP_SCHEME_ENTRY, type SchemeRegistrar } from './app-protocol';
import { MEDIA_SCHEME_ENTRY } from './media-handler';

/**
 * Registers every privileged scheme in ONE call. protocol.registerSchemesAsPrivileged replaces
 * the previous registration, so separate calls would silently drop app (no secure context).
 * Must run before the app ready event.
 */
export function registerPrivilegedSchemes(registrar: SchemeRegistrar): void {
  registrar.registerSchemesAsPrivileged([APP_SCHEME_ENTRY, MEDIA_SCHEME_ENTRY]);
}
