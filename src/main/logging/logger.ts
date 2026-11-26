/**
 * Local console logger (design sections 3.5 and 6). It accepts a fixed event code and a small
 * object of allow-listed scalar fields. It never accepts a raw Error message, a payload or a path
 * (R15.3), and it has no network sink.
 */
export type LogLevel = 'info' | 'warn' | 'error';

export const ALLOWED_LOG_FIELDS = [
  'reason',
  'exitCode',
  'platform',
  'channel',
  'code',
  'errorName',
] as const;

export type LogFieldName = (typeof ALLOWED_LOG_FIELDS)[number];
export type LogFields = Partial<Record<LogFieldName, string | number | boolean>>;

export interface Logger {
  info(event: string, fields?: LogFields): void;
  warn(event: string, fields?: LogFields): void;
  error(event: string, fields?: LogFields): void;
}

export interface LogSink {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

const REDACTED = '[redacted]';
const MAX_STRING_LENGTH = 64;
const EVENT_PATTERN = /^[a-z][a-z0-9_.]{0,63}$/;
const SAFE_STRING_PATTERN = /^[A-Za-z0-9_.:-]+$/;

function sanitizeValue(value: unknown): string {
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : REDACTED;
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'string' && value.length <= MAX_STRING_LENGTH) {
    // Path separators, spaces and control characters are not in the safe set, so paths and free
    // text cannot pass through an allow-listed field.
    return SAFE_STRING_PATTERN.test(value) ? value : REDACTED;
  }
  return REDACTED;
}

/** Pure formatter. Unknown fields are dropped and unsafe values are replaced. */
export function formatLogLine(level: LogLevel, event: string, fields?: LogFields): string {
  const safeEvent = EVENT_PATTERN.test(event) ? event : 'invalid_event';
  const parts: string[] = [`[necroamp] ${level} ${safeEvent}`];
  if (fields !== undefined) {
    for (const name of ALLOWED_LOG_FIELDS) {
      const value = fields[name];
      if (value !== undefined) parts.push(`${name}=${sanitizeValue(value)}`);
    }
  }
  return parts.join(' ');
}

export function createLogger(sink: LogSink): Logger {
  return {
    info: (event, fields) => sink.info(formatLogLine('info', event, fields)),
    warn: (event, fields) => sink.warn(formatLogLine('warn', event, fields)),
    error: (event, fields) => sink.error(formatLogLine('error', event, fields)),
  };
}

/** Returns a safe error name. Never the message or stack (R15.3). */
export function errorNameOf(value: unknown): string {
  if (value instanceof Error && /^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(value.name)) {
    return value.name;
  }
  return 'UnknownError';
}
