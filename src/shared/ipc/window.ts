import { z } from 'zod';
import { ipcResultSchema } from './result';

/** `window:minimize`, `window:toggle-maximize` and `window:close` take no arguments. */
export const windowActionRequestSchema = z.tuple([]);
export type WindowActionRequest = z.infer<typeof windowActionRequestSchema>;
export const windowActionResponseSchema = ipcResultSchema(
  z.strictObject({ applied: z.literal(true) }),
);
export type WindowActionResponse = z.infer<typeof windowActionResponseSchema>;

export const windowStateSchema = z.strictObject({
  maximized: z.boolean(),
  fullScreen: z.boolean(),
  focused: z.boolean(),
  platform: z.enum(['win32', 'darwin', 'linux']),
});
export type WindowState = z.infer<typeof windowStateSchema>;

export const windowGetStateRequestSchema = z.tuple([]);
export type WindowGetStateRequest = z.infer<typeof windowGetStateRequestSchema>;
export const windowGetStateResponseSchema = ipcResultSchema(windowStateSchema);
export type WindowGetStateResponse = z.infer<typeof windowGetStateResponseSchema>;

/** `window:state-changed` (main -> renderer push). */
export const windowStateChangedEventSchema = windowStateSchema;
