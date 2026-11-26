import { defineConfig } from '@playwright/test';

// T7.1: one worker, no retries (a flaky test is quarantined and reported, not retried), traces kept on failure.
// The suite drives the production build in out/. Run `pnpm build` first; global-setup fails fast on a missing or stale build.
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  globalSetup: './tests/e2e/global-setup.ts',
  workers: 1,
  fullyParallel: false,
  retries: 0,
  forbidOnly: true,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  outputDir: 'test-results',
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
