const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
/** Shown when a time is unknown, negative or not finite. */
export const UNKNOWN_TIME = '--:--';

/**
 * Formats seconds as `m:ss`, or `h:mm:ss` from one hour. Fractions are truncated so the
 * display never runs ahead of the real position. `null` and invalid input give `--:--`.
 */
export function formatTime(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) {
    return UNKNOWN_TIME;
  }
  const total = Math.floor(seconds);
  const hours = Math.floor(total / SECONDS_PER_HOUR);
  const minutes = Math.floor((total % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const secs = total % SECONDS_PER_MINUTE;
  const ss = String(secs).padStart(2, '0');
  if (hours > 0) {
    return `${String(hours)}:${String(minutes).padStart(2, '0')}:${ss}`;
  }
  return `${String(minutes)}:${ss}`;
}
