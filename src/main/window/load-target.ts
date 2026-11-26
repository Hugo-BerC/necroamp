import { APP_ENTRY_URL } from '../constants';
import { parseDevOrigin } from '../security/trusted-origins';

/**
 * Pure choice between the production `app://` entry and the dev server (design section 3.1).
 * The dev server is used only when the app is not packaged and `ELECTRON_RENDERER_URL` is a
 * loopback http origin. Anything else falls back to production.
 */
export type LoadTarget =
  | { readonly kind: 'production'; readonly url: string }
  | { readonly kind: 'development'; readonly url: string; readonly devOrigin: string };

export interface LoadTargetEnv {
  readonly ELECTRON_RENDERER_URL?: string | undefined;
}

export function resolveLoadTarget(env: LoadTargetEnv, isPackaged: boolean): LoadTarget {
  if (!isPackaged) {
    const dev = parseDevOrigin(env.ELECTRON_RENDERER_URL);
    if (dev !== null) return { kind: 'development', url: `${dev.origin}/`, devOrigin: dev.origin };
  }
  return { kind: 'production', url: APP_ENTRY_URL };
}
