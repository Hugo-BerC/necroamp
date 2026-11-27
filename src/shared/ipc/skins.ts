import { z } from 'zod';
import {
  SKIN_ISSUE_CODES,
  SKIN_LIMITS,
  resolvedSkinSchema,
  safeTextSchema,
  skinAssetUrlSchema,
  skinIdSchema,
} from '../skins';
import { ipcResultSchema } from './result';

export const SKIN_FALLBACK_REASONS = [
  'none-selected',
  'missing',
  'invalid',
  'incompatible',
  'load-failed',
] as const;
export const skinStatusSchema = z.enum(['ok', 'invalid', 'incompatible']);

export const skinSummarySchema = z.strictObject({
  id: skinIdSchema,
  name: safeTextSchema(48),
  version: z.string().max(16),
  author: safeTextSchema(80),
  description: safeTextSchema(280),
  origin: z.enum(['embedded', 'builtin']),
  status: skinStatusSchema,
  errorCodes: z.array(z.enum(SKIN_ISSUE_CODES)).max(SKIN_LIMITS.errorCodesPerSkin),
  previewUrl: skinAssetUrlSchema.optional(),
});
export type SkinSummary = z.infer<typeof skinSummarySchema>;

/** `skins:list` */
export const skinsListRequestSchema = z.tuple([]);
export type SkinsListRequest = z.infer<typeof skinsListRequestSchema>;
export const skinsListResponseSchema = ipcResultSchema(
  z.strictObject({
    skins: z.array(skinSummarySchema).max(SKIN_LIMITS.skinsScanned + 1),
    activeId: skinIdSchema,
  }),
);
export type SkinsListResponse = z.infer<typeof skinsListResponseSchema>;

/** `skins:get-active` */
export const skinsGetActiveRequestSchema = z.tuple([]);
export type SkinsGetActiveRequest = z.infer<typeof skinsGetActiveRequestSchema>;
export const activeSkinSchema = z.strictObject({
  activeId: skinIdSchema,
  requestedId: skinIdSchema.nullable(),
  fallbackReason: z.enum(SKIN_FALLBACK_REASONS).optional(),
  skin: resolvedSkinSchema,
});
export type ActiveSkin = z.infer<typeof activeSkinSchema>;
export const skinsGetActiveResponseSchema = ipcResultSchema(activeSkinSchema);
export type SkinsGetActiveResponse = z.infer<typeof skinsGetActiveResponseSchema>;

/** `skins:set-active`: the renderer names a skin id, never a path. */
export const skinsSetActiveRequestSchema = z.tuple([z.strictObject({ skinId: skinIdSchema })]);
export type SkinsSetActiveRequest = z.infer<typeof skinsSetActiveRequestSchema>;
export const skinsSetActiveResponseSchema = ipcResultSchema(
  z.discriminatedUnion('applied', [
    z.strictObject({ applied: z.literal(true), active: activeSkinSchema, persisted: z.boolean() }),
    z.strictObject({
      applied: z.literal(false),
      reason: z.enum(['unknown-skin', 'invalid', 'incompatible']),
    }),
  ]),
);
export type SkinsSetActiveResponse = z.infer<typeof skinsSetActiveResponseSchema>;

/** `skins:changed` (main -> renderer push). */
export const skinsChangedEventSchema = activeSkinSchema;
export type SkinsChangedEvent = z.infer<typeof skinsChangedEventSchema>;
