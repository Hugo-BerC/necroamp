import { z } from 'zod';
import { ipcResultSchema } from './result';

/** Commands the native menu can send to the renderer. */
export const MENU_COMMANDS = [
  'open-files',
  'open-folder',
  'clear-playlist',
  'open-skin-picker',
] as const;

/** `menu:command` (main -> renderer). Carries a command name only, never data. */
export const menuCommandSchema = z.strictObject({ command: z.enum(MENU_COMMANDS) });
export type MenuCommand = z.infer<typeof menuCommandSchema>;

/** `menu:report-state` (renderer -> main): drives the enabled state of "Clear Playlist". */
export const menuReportStateRequestSchema = z.tuple([z.strictObject({ hasTracks: z.boolean() })]);
export type MenuReportStateRequest = z.infer<typeof menuReportStateRequestSchema>;

export const menuReportStateResponseSchema = ipcResultSchema(
  z.strictObject({ applied: z.literal(true) }),
);
export type MenuReportStateResponse = z.infer<typeof menuReportStateResponseSchema>;
