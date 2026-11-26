import { z } from 'zod';
import { ipcResultSchema } from './result';

export const platformSchema = z.enum(['win32', 'darwin', 'linux']);
export type Platform = z.infer<typeof platformSchema>;

/** `app:get-info` takes no arguments. Any extra invoke argument fails parsing. */
export const appInfoRequestSchema = z.tuple([]);
export type AppInfoRequest = z.infer<typeof appInfoRequestSchema>;

export const appInfoSchema = z.strictObject({
  name: z.string().min(1).max(64),
  version: z.string().min(1).max(64),
  platform: platformSchema,
});
export type AppInfo = z.infer<typeof appInfoSchema>;

export const appInfoResponseSchema = ipcResultSchema(appInfoSchema);
export type AppInfoResponse = z.infer<typeof appInfoResponseSchema>;
