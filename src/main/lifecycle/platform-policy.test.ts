import { describe, expect, it } from 'vitest';
import { shouldCreateWindowOnActivate, shouldQuitOnAllWindowsClosed } from './platform-policy';

describe('shouldQuitOnAllWindowsClosed', () => {
  it.each([
    ['win32', true],
    ['linux', true],
    ['darwin', false],
    ['freebsd', true],
    ['', true],
  ])('%s -> %s', (platform, expected) => {
    expect(shouldQuitOnAllWindowsClosed(platform)).toBe(expected);
  });
});

describe('shouldCreateWindowOnActivate', () => {
  it('creates a window only on macOS with no open windows', () => {
    expect(shouldCreateWindowOnActivate('darwin', 0)).toBe(true);
    expect(shouldCreateWindowOnActivate('darwin', 1)).toBe(false);
  });

  it.each(['win32', 'linux', 'freebsd', ''])('never creates a window on %s', (platform) => {
    expect(shouldCreateWindowOnActivate(platform, 0)).toBe(false);
  });
});
