import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'electron-vite';
import type { Plugin } from 'vite';
import { buildMetaCspTag } from './src/main/security/meta-csp-tag';

// Single alias table. tsconfig `paths` and vitest.config.ts mirror it (R2.2).
const alias = {
  '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
  '@main': fileURLToPath(new URL('./src/main', import.meta.url)),
  '@renderer': fileURLToPath(new URL('./src/renderer', import.meta.url)),
};

// Injects the production meta CSP into the built index.html only (T2.7). The source index.html has
// no meta CSP, so the dev server is not blocked. The dev policy is delivered by a header hook.
const metaCspPlugin = (): Plugin => ({
  name: 'necroamp-meta-csp',
  apply: 'build',
  transformIndexHtml: () => {
    const tag = buildMetaCspTag();
    return [{ ...tag, attrs: { ...tag.attrs } }];
  },
});

export default defineConfig({
  main: {
    resolve: { alias },
    build: {
      outDir: 'out/main',
      rollupOptions: {
        input: { index: fileURLToPath(new URL('./src/main/index.ts', import.meta.url)) },
        output: { format: 'cjs', entryFileNames: '[name].js' },
      },
    },
  },
  preload: {
    resolve: { alias },
    build: {
      outDir: 'out/preload',
      // A sandboxed preload cannot require() packages from node_modules, so bundle them.
      externalizeDeps: false,
      rollupOptions: {
        input: { index: fileURLToPath(new URL('./src/preload/index.ts', import.meta.url)) },
        // Sandboxed preload must be a single CommonJS script (design section 1).
        output: { format: 'cjs', entryFileNames: '[name].js' },
      },
    },
  },
  renderer: {
    root: 'src/renderer',
    resolve: { alias },
    plugins: [react(), metaCspPlugin()],
    build: {
      outDir: 'out/renderer',
      emptyOutDir: true,
      rollupOptions: {
        input: { index: fileURLToPath(new URL('./src/renderer/index.html', import.meta.url)) },
      },
    },
  },
});
