import { describe, expect, it } from 'vitest';
import { MAX_REGISTRY_ENTRIES, createMediaRegistry } from './media-registry';

describe('createMediaRegistry', () => {
  it('issues random-looking uuid tokens and resolves them', () => {
    const registry = createMediaRegistry();
    const token = registry.issue('/music/a.mp3');
    expect(token).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(registry.resolve(token as string)).toBe('/music/a.mp3');
    expect(registry.size).toBe(1);
  });

  it('re-issues the same token for the same path', () => {
    const registry = createMediaRegistry();
    expect(registry.issue('/a.mp3')).toBe(registry.issue('/a.mp3'));
    expect(registry.size).toBe(1);
  });

  it('never resolves unknown tokens or prototype keys', () => {
    const registry = createMediaRegistry();
    for (const key of ['', 'forged', '__proto__', 'constructor', 'toString']) {
      expect(registry.resolve(key)).toBeUndefined();
    }
  });

  it('refuses to exceed the cap', () => {
    let n = 0;
    const registry = createMediaRegistry(() => `t${n++}`, 3);
    expect(registry.issue('/1')).not.toBeNull();
    expect(registry.issue('/2')).not.toBeNull();
    expect(registry.issue('/3')).not.toBeNull();
    expect(registry.issue('/4')).toBeNull();
    expect(registry.issue('/1')).toBe('t0');
  });

  it('refuses a colliding generated token', () => {
    const registry = createMediaRegistry(() => 'same');
    expect(registry.issue('/1')).toBe('same');
    expect(registry.issue('/2')).toBeNull();
    expect(registry.resolve('same')).toBe('/1');
  });

  it('clear forgets every token', () => {
    const registry = createMediaRegistry();
    const token = registry.issue('/a.mp3') as string;
    registry.clear();
    expect(registry.size).toBe(0);
    expect(registry.resolve(token)).toBeUndefined();
  });

  it('defaults the cap to 5000', () => {
    expect(MAX_REGISTRY_ENTRIES).toBe(5000);
  });
});
