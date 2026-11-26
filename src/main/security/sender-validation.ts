import { isTrustedUrl } from './trusted-origins';

/**
 * IPC sender validation (design section 3.2, R4.4). Structural types keep this unit testable
 * without Electron. `IpcMainInvokeEvent` satisfies `SenderEventLike`.
 */
export interface FrameLike {
  readonly url: string;
  /** `null` only for the top frame of a page. */
  readonly parent: unknown;
}

export interface SenderEventLike {
  readonly senderFrame: FrameLike | null | undefined;
  readonly sender?: unknown;
}

/**
 * True only if all hold:
 * 1. `event.senderFrame` exists (Electron returns null for a destroyed frame).
 * 2. It is a top frame (`parent === null`). Sub-frames are rejected.
 * 3. Its URL has a trusted origin.
 * 4. `event.sender` is a web contents the app registered (`isRegisteredSender`).
 * Any exception while reading the frame fails closed.
 */
export function isTrustedSender(
  event: SenderEventLike,
  trusted: readonly string[],
  isRegisteredSender: (sender: unknown) => boolean,
): boolean {
  try {
    const frame = event.senderFrame;
    if (frame === null || frame === undefined) return false;
    if (frame.parent !== null) return false;
    if (!isTrustedUrl(frame.url, trusted)) return false;
    return isRegisteredSender(event.sender);
  } catch {
    return false;
  }
}
