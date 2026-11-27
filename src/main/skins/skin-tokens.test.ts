import { describe, expect, it } from 'vitest';
import { createSkinTokenStore } from './skin-tokens';

const uuids = (): (() => string) => {
  let n = 0;
  return () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`;
};

describe('skin token store', () => {
  it('mints one token per skin and asset and resolves it back', () => {
    const store = createSkinTokenStore(uuids());
    const a = store.mint('one', 'bg');
    expect(a).toMatch(/^[0-9a-f-]{36}$/);
    expect(store.mint('one', 'bg')).toBe(a);
    expect(store.mint('one', 'fg')).not.toBe(a);
    expect(store.mint('two', 'bg')).not.toBe(a);
    expect(store.resolve(a as string)).toEqual({ skinId: 'one', assetKey: 'bg' });
    expect(store.size).toBe(3);
  });

  it('does not let ids that join into the same text share a token', () => {
    const store = createSkinTokenStore(uuids());
    expect(store.mint('a', 'b-c')).not.toBe(store.mint('a-b', 'c'));
  });

  it('never resolves an unknown token', () => {
    const store = createSkinTokenStore(uuids());
    expect(store.resolve('00000000-0000-4000-8000-000000000999')).toBeUndefined();
    expect(store.resolve('../../etc/passwd')).toBeUndefined();
  });

  it('stops minting at the limit but keeps existing tokens', () => {
    const store = createSkinTokenStore(uuids(), 2);
    const first = store.mint('s', 'a');
    store.mint('s', 'b');
    expect(store.mint('s', 'c')).toBeNull();
    expect(store.mint('s', 'a')).toBe(first);
  });

  it('refuses a colliding generated token', () => {
    const store = createSkinTokenStore(() => 'same');
    expect(store.mint('s', 'a')).toBe('same');
    expect(store.mint('s', 'b')).toBeNull();
  });

  it('clear forgets every token', () => {
    const store = createSkinTokenStore(uuids());
    const token = store.mint('s', 'a') as string;
    store.clear();
    expect(store.size).toBe(0);
    expect(store.resolve(token)).toBeUndefined();
  });
});
