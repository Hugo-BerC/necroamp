import { z } from 'zod';
import { ipcResultSchema } from './result';

/** Maximum tracks one `library:open-files` call (and the main-side registry) may hold. */
export const MAX_TRACKS_PER_REQUEST = 5000;

const TOKEN = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
export const trackMediaUrlSchema = z.string().regex(new RegExp(`^media://track/${TOKEN}$`));
export const artworkUrlSchema = z.string().regex(new RegExp(`^media://art/${TOKEN}$`));

/** Renderer-visible track. It never carries a filesystem path (ADR 0006 item 3). */
export const trackInfoSchema = z.strictObject({
  trackId: z.uuid(),
  mediaUrl: trackMediaUrlSchema,
  fileName: z.string().min(1).max(255),
  title: z.string().min(1).max(256),
  artist: z.string().max(256),
  album: z.string().max(256),
  durationSec: z.number().finite().nonnegative().nullable(),
  artworkUrl: artworkUrlSchema.nullable(),
  available: z.boolean(),
});
export type TrackInfo = z.infer<typeof trackInfoSchema>;

/** `library:open-files`: the renderer only chooses single or multiple selection. */
export const openFilesRequestSchema = z.tuple([z.strictObject({ multiple: z.boolean() })]);
export type OpenFilesRequest = z.infer<typeof openFilesRequestSchema>;

export const openFilesResponseSchema = ipcResultSchema(
  z.strictObject({ tracks: z.array(trackInfoSchema).max(MAX_TRACKS_PER_REQUEST) }),
);
export type OpenFilesResponse = z.infer<typeof openFilesResponseSchema>;
