import { z } from 'zod';
import { MAX_TRACKS_PER_REQUEST, trackInfoSchema } from './library';
import { ipcResultSchema } from './result';

/** Current on-disk and wire version of the persisted playlist. */
export const PLAYLIST_SCHEMA_VERSION = 1;

/** Optional selected track: a session token, or null for no selection. Never a path. */
export const selectedTrackIdSchema = z.uuid().nullable();
export type SelectedTrackId = z.infer<typeof selectedTrackIdSchema>;

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
    /** Session token of the track selected when last saved, already resolved against items. */
    selectedTrackId: selectedTrackIdSchema.optional(),
  }),
);
export type PlaylistLoadResponse = z.infer<typeof playlistLoadResponseSchema>;

/** `playlist:save`: the ordered entries to persist. */
export const playlistSaveRequestSchema = z.tuple([
  z.strictObject({
    items: z.array(playlistEntrySchema).max(MAX_TRACKS_PER_REQUEST),
    selectedTrackId: selectedTrackIdSchema.optional(),
  }),
]);
export type PlaylistSaveRequest = z.infer<typeof playlistSaveRequestSchema>;
export const playlistSaveResponseSchema = ipcResultSchema(
  z.strictObject({ saved: z.literal(true) }),
);
export type PlaylistSaveResponse = z.infer<typeof playlistSaveResponseSchema>;
