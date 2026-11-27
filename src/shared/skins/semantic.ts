/** Issue codes shared by the shared validators, the main-process scanner and the IPC contract. */
export const SKIN_ISSUE_CODES = [
  'SCHEMA',
  'SCHEMA_VERSION',
  'JSON_PARSE',
  'ID_MISMATCH',
  'RESERVED_ID',
  'ASSET_TYPE_MISMATCH',
  'ASSET_PATH_DUPLICATE',
  'ASSET_MISSING_REF',
  'ASSET_LIMIT',
  'ASSET_KIND',
  'STYLE_MISSING_REF',
  'STYLE_LIMIT',
  'SURFACE_APP_MISSING',
  'REGION_FRAME_MISSING',
  'LAYOUT_NO_BASE_VARIANT',
  'LAYOUT_DUPLICATE_MIN_WIDTH',
  'LAYOUT_AREAS_SHAPE',
  'LAYOUT_AREA_NOT_RECT',
  'LAYOUT_MANDATORY_MISSING',
  'LAYOUT_DOES_NOT_FIT',
  'EQ_BAND_NOT_VERTICAL',
  'SEEK_NOT_HORIZONTAL',
  'KNOB_SWEEP',
  'PARAM_MISSING',
  'NEEDLES_MISSING',
  'CONTRAST',
  // scanner (main) codes
  'MANIFEST_TOO_LARGE',
  'FILE_MISSING',
  'FILE_TOO_LARGE',
  'FILE_SYMLINK',
  'FILE_ESCAPE',
  'MAGIC_MISMATCH',
  'IMAGE_TOO_LARGE',
  'IMAGE_UNPARSEABLE',
  'SVG_UNSAFE',
  'TOTAL_TOO_LARGE',
] as const;
export type SkinIssueCode = (typeof SKIN_ISSUE_CODES)[number];

/** `path` is a JSON path such as `components.seek.control`, never a file path. */
export interface SkinIssue {
  readonly code: SkinIssueCode;
  readonly path: string;
}
