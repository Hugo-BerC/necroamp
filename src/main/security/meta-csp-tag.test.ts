import { describe, expect, it } from 'vitest';
import { buildMetaCsp } from './csp';
import { buildMetaCspTag } from './meta-csp-tag';

describe('buildMetaCspTag', () => {
  it('carries the production meta policy and nothing else', () => {
    const tag = buildMetaCspTag();
    expect(tag.tag).toBe('meta');
    expect(tag.attrs['http-equiv']).toBe('Content-Security-Policy');
    expect(tag.attrs.content).toBe(buildMetaCsp({ mode: 'production' }));
    expect(tag.injectTo).toBe('head-prepend');
  });

  it('has no development allowance and no directive a meta element ignores', () => {
    const { content } = buildMetaCspTag().attrs;
    expect(content).not.toMatch(/unsafe-|localhost|ws:|data:|\*|frame-ancestors/);
  });
});
