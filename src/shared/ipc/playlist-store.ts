import { z } from 'zod';
import { MAX_TRACKS_PER_REQUEST, trackInfoSchema } from './library';
import { ipcResultSchema } from './result';

/** Current on-disk and wire version of the persisted playlist. */
export const PLAYLIST_SCHEMA_VERSION = 1;

/** A playlist entry names a track by its session token. Paths never cross the bridge. */
export const playlistEntrySchema = z.strictObject({ trackId: z.uuid() });
export type PlaylistEntry = z.infer<typeof playlistEntrySchema>;

/** `playlist:load`: no arguments. */
export const playlistLoadRequestSchema = z.tuple([]);
export type PlaylistLoadRequest = z.infer<typeof playlistLoadRequestSchema>;
export const playlistLoadResponseSchema = ipcResultSchema(
  z.strictObject({
    schemaVersion: z.literal(PLAYLIST_SCHEMA_VERSION),
    items: z.array(trackInfoSchema).max(MAX_TRACKS_PER_REQUEST),
  }),
);
export type PlaylistLoadResponse = z.infer<typeof playlistLoadResponseSchema>;

/** `playlist:save`: the ordered entries to persist. */
export const playlistSaveRequestSchema = z.tuple([
  z.strictObject({ items: z.array(playlistEntrySchema).max(MAX_TRACKS_PER_REQUEST) }),
]);
export type PlaylistSaveRequest = z.infer<typeof playlistSaveRequestSchema>;
export const playlistSaveResponseSchema = ipcResultSchema(
  z.strictObject({ saved: z.literal(true) }),
);
export type PlaylistSaveResponse = z.infer<typeof playlistSaveResponseSchema>;
