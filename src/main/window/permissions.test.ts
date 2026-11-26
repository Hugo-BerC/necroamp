import { describe, expect, it, vi } from 'vitest';
import { installPermissionHandlers, type SessionLike } from './permissions';

function fakeSession() {
  const captured: {
    request?: Parameters<SessionLike['setPermissionRequestHandler']>[0];
    check?: () => boolean;
    device?: () => boolean;
  } = {};
  const session: SessionLike = {
    setPermissionRequestHandler: (h) => {
      captured.request = h;
    },
    setPermissionCheckHandler: (h) => {
      captured.check = h;
    },
    setDevicePermissionHandler: (h) => {
      captured.device = h;
    },
  };
  return { session, captured };
}

describe('installPermissionHandlers', () => {
  it.each([
    'media',
    'geolocation',
    'notifications',
    'clipboard-read',
    'openExternal',
    'fullscreen',
    'serial',
    'hid',
    'usb',
    'unknown',
  ])('denies permission request %s', (permission) => {
    const { session, captured } = fakeSession();
    installPermissionHandlers(session);
    const callback = vi.fn();
    captured.request?.({}, permission, callback);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(false);
  });

  it('denies permission checks and device permissions', () => {
    const { session, captured } = fakeSession();
    installPermissionHandlers(session);
    expect(captured.check?.()).toBe(false);
    expect(captured.device?.()).toBe(false);
  });

  it('installs all three handlers', () => {
    const { session, captured } = fakeSession();
    installPermissionHandlers(session);
    expect(captured.request).toBeTypeOf('function');
    expect(captured.check).toBeTypeOf('function');
    expect(captured.device).toBeTypeOf('function');
  });
});
