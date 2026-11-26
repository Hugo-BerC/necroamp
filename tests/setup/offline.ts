import fc from 'fast-check';
import { vi } from 'vitest';

// Shared determinism setup (R12.3). Any accidental network use fails the test.
const NETWORK_BLOCKED = 'Network access is blocked in tests. Inject a fake client instead.';

function blocked(): never {
  throw new Error(NETWORK_BLOCKED);
}

export function installOfflineGuards(): void {
  vi.stubGlobal('fetch', blocked);
  vi.stubGlobal('XMLHttpRequest', blocked);
  vi.stubGlobal('WebSocket', blocked);
  vi.stubGlobal('EventSource', blocked);
}

// Property tests run at least 100 times and print the seed on failure.
fc.configureGlobal({ numRuns: 100, verbose: 1 });
installOfflineGuards();
