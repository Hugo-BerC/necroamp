import { describe, expect, it, vi } from 'vitest';
import { registerPrivilegedSchemes } from './register-schemes';

describe('registerPrivilegedSchemes', () => {
  it('registers app and media in a single call without bypassCSP', () => {
    const registerSchemesAsPrivileged = vi.fn();
    registerPrivilegedSchemes({ registerSchemesAsPrivileged });
    expect(registerSchemesAsPrivileged).toHaveBeenCalledTimes(1);
    const [[schemes]] = registerSchemesAsPrivileged.mock.calls as [
      [{ scheme: string; privileges: Record<string, boolean> }[]],
    ];
    expect(schemes.map((s) => s.scheme)).toEqual(['app', 'media']);
    expect(schemes[0]?.privileges).toEqual({ standard: true, secure: true, supportFetchAPI: true });
    expect(schemes[1]?.privileges).toMatchObject({ stream: true, corsEnabled: true });
    expect(JSON.stringify(schemes)).not.toContain('bypassCSP');
  });
});
