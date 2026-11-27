import { z } from 'zod';
import { assetKeySchema } from './ids';
import { skinManifestSchema } from './manifest';

/** The only URL form a skin asset may take in the renderer. */
export const skinAssetUrlSchema = z
  .string()
  .regex(/^media:\/\/skin\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);

export const resolvedSkinSchema = z.strictObject({
  manifest: skinManifestSchema,
  assetUrls: z.record(assetKeySchema, skinAssetUrlSchema),
});
export type ResolvedSkin = z.infer<typeof resolvedSkinSchema>;
