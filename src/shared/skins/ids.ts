import { z } from 'zod';

export const REGION_IDS = [
  'track-info',
  'artwork',
  'transport',
  'seek',
  'volume',
  'visualization',
  'equalizer',
  'playlist',
  'status',
  'github',
] as const;
export type RegionId = (typeof REGION_IDS)[number];

export const MANDATORY_REGIONS = ['transport', 'seek', 'track-info', 'volume', 'playlist'] as const;

export const ICON_IDS = [
  'play',
  'pause',
  'stop',
  'previous',
  'next',
  'shuffle',
  'repeat',
  'repeat-one',
  'volume',
  'mute',
  'open',
  'clear',
  'minimize',
  'maximize',
  'restore',
  'close',
] as const;
export type IconId = (typeof ICON_IDS)[number];

const KEY_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
export const skinIdSchema = z.string().max(40).regex(KEY_RE);
export const assetKeySchema = z.string().max(40).regex(KEY_RE);
/** Keys of surfaces and control styles. */
export const styleKeySchema = assetKeySchema;

export const COLOR_REFS = [
  'accent',
  'glow',
  'text',
  'textMuted',
  'displayText',
  'warning',
  'danger',
] as const;
export const colorRefSchema = z.enum(COLOR_REFS);
export const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/);

/** Plain text, rendered as React text only: no control characters, no angle brackets. */
export const safeTextSchema = (max: number) =>
  z
    .string()
    .min(1)
    .max(max)
    // eslint-disable-next-line no-control-regex -- the control range is exactly what is rejected
    .regex(/^[^\u0000-\u001f\u007f<>]+$/);
