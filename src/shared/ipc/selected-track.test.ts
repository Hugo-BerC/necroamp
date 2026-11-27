import { describe, expect, it } from 'vitest';
import { resolveSelectedTrackId } from './selected-track';

const items = [{ trackId: 'a' }, { trackId: 'b' }];

describe('resolveSelectedTrackId', () => {
  it('keeps a selection that exists', () => {
    expect(resolveSelectedTrackId(items, 'b')).toBe('b');
  });
  it.each([undefined, null, 'zzz'])('falls back to the first track for %s', (value) => {
    expect(resolveSelectedTrackId(items, value)).toBe('a');
  });
  it('returns null for an empty playlist', () => {
    expect(resolveSelectedTrackId([], 'a')).toBeNull();
    expect(resolveSelectedTrackId([], undefined)).toBeNull();
  });
});
