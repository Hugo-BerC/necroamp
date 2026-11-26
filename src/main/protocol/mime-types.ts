/**
 * Extension allow-list for the `app://` protocol (design section 4). A file whose extension is
 * not listed is never served. The Audio and Skin phases extend this table through a design change.
 */
const MIME_TYPES: Readonly<Record<string, string>> = Object.freeze({
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
});

/** `extension` includes the leading dot and is compared in lower case. */
export function mimeTypeFor(extension: string): string | undefined {
  const key = extension.toLowerCase();
  return Object.hasOwn(MIME_TYPES, key) ? MIME_TYPES[key] : undefined;
}

export const isAllowedExtension = (extension: string): boolean =>
  mimeTypeFor(extension) !== undefined;
