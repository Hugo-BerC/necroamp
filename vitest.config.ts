import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Alias table. Must equal the tables in electron.vite.config.ts and tsconfig `paths` (R2.2).
// tests/config/alias-consistency.test.ts enforces this.
export const alias = {
  '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
  '@main': fileURLToPath(new URL('./src/main', import.meta.url)),
  '@renderer': fileURLToPath(new URL('./src/renderer', import.meta.url)),
};

export default defineConfig({
  resolve: { alias },
  test: {
    globals: false,
    passWithNoTests: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main/index.ts',
        'src/renderer/main.tsx',
        '**/*.d.ts',
        '**/*.test.*',
        '**/*.module.css',
      ],
      reporter: ['text-summary', 'html'],
      reportsDirectory: 'coverage',
      thresholds: {
        statements: 80,
        lines: 80,
        functions: 80,
        branches: 75,
        // Security-critical IPC validation modules (design section 10, N5).
        'src/shared/ipc/**': { lines: 95, branches: 95 },
        'src/main/ipc/register-handler.ts': { lines: 95, branches: 95 },
        'src/main/security/sender-validation.ts': { lines: 95, branches: 95 },
        'src/main/security/trusted-origins.ts': { lines: 95, branches: 95 },
        'src/main/protocol/resolve-app-path.ts': { lines: 95, branches: 95 },
        'src/main/security/csp.ts': { lines: 95, branches: 95 },
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: [
            'src/main/**/*.test.ts',
            'src/shared/**/*.test.ts',
            'src/preload/**/*.test.ts',
            'tests/**/*.test.ts',
          ],
          exclude: ['tests/e2e/**', 'tests/fixtures/**', 'tests/setup/**'],
          setupFiles: ['tests/setup/node.setup.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'renderer',
          environment: 'jsdom',
          include: [
            'src/renderer/**/*.test.ts',
            'src/renderer/**/*.test.tsx',
            'tests/a11y/**/*.test.tsx',
            'tests/integration/**/*.integration.test.tsx',
          ],
          setupFiles: ['tests/setup/renderer.setup.ts'],
        },
      },
    ],
  },
});
