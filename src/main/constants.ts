export const APP_NAME = 'NecroAmp';

/** Custom protocol that serves the production renderer (design section 4). */
export const APP_SCHEME = 'app';
export const APP_HOST = 'renderer';
export const APP_ORIGIN = `${APP_SCHEME}://${APP_HOST}`;
export const APP_ENTRY_URL = `${APP_ORIGIN}/index.html`;

/** Built preload script, relative to the directory of the built main bundle. */
export const PRELOAD_PATH_SEGMENTS = ['..', 'preload', 'index.js'] as const;

/** Built renderer root, relative to `app.getAppPath()`. */
export const RENDERER_ROOT_SEGMENTS = ['out', 'renderer'] as const;
