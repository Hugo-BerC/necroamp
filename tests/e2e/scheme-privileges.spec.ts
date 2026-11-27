import { expect, test } from './fixtures/launch';

// Block A regression guard: registering the media:// scheme must not drop the privileges of
// app://. Electron's protocol.registerSchemesAsPrivileged may be called only once; a second call
// replaces the first registration. These checks observe the result from the live renderer.

test.describe('privileged scheme registration', () => {
  test('app://renderer is still a secure context with a standard origin', async ({ page }) => {
    const result = await page.evaluate(() => ({
      secure: window.isSecureContext,
      origin: window.location.origin,
      mediaDevices: typeof navigator.mediaDevices,
    }));
    expect(result).toEqual({ secure: true, origin: 'app://renderer', mediaDevices: 'object' });
  });
});
