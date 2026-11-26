import { describe, expect, it } from 'vitest';
import { readCustomProperties } from '@renderer/app/theme/contrast';

// Deterministic coverage of the duplicate-declaration branch in readCustomProperties.
// The property test in src/renderer/app/theme reaches it only when its random generator emits a
// repeated name, which made global branch coverage vary by one between runs (see docs/testing).
describe('readCustomProperties duplicate declarations', () => {
  it('keeps the first declaration of a repeated name', () => {
    const map = readCustomProperties('--a: #111111; --a: #222222; --b: var(--a);');
    expect(map.get('--a')).toBe('#111111');
    expect(map.get('--b')).toBe('#111111');
  });
});
