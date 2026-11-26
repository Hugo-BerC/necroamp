import { builtinModules } from 'node:module';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

const nodeBuiltins = builtinModules.flatMap((name) => [name, `node:${name}`]);
const deepRelative = {
  group: ['../../../*'],
  message: 'Use a path alias instead of a deep relative import.',
};
const networkModules = [
  'http',
  'https',
  'net',
  'node:http',
  'node:https',
  'node:net',
  'undici',
  'electron-updater',
];
const forbidElectronNamed = {
  name: 'electron',
  importNames: ['crashReporter', 'autoUpdater', 'net'],
  message: 'No telemetry, auto-update or network modules (R15.1).',
};

const restrictedImports = (patterns, paths = []) => ({
  'no-restricted-imports': ['error', { paths, patterns }],
});

const openExternal = {
  selector: "MemberExpression[property.name='openExternal']",
  message: 'Use the allow-listed external-link wrapper (R6.5).',
};
const browserWindow = {
  selector: "NewExpression[callee.name='BrowserWindow']",
  message: 'Create windows only in src/main/window/create-main-window.ts (R3.1).',
};
const ipcLiteral = {
  selector:
    'CallExpression[callee.property.name=/^(handle|handleOnce|invoke|removeHandler)$/][arguments.0.value=/^[a-z][a-z0-9-]*:[a-z][a-z0-9-]*$/]',
  message: 'IPC channel names must come from src/shared/ipc/channels.ts (R4.1).',
};
const audioSyntax = {
  selector:
    'Identifier[name=/^(AudioContext|webkitAudioContext|OfflineAudioContext|AnalyserNode|requestAnimationFrame)$/]',
  message: 'Audio and animation globals are not allowed in M0-M1 renderer code (R8.4, R8.7).',
};
const networkGlobals = ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource'].map((name) => ({
  name,
  message: 'Network access from the renderer or preload is denied (R15.1).',
}));

export default tseslint.config(
  {
    ignores: [
      'node_modules',
      'out',
      'dist',
      'coverage',
      'test-results',
      'playwright-report',
      '.agents',
      '.kiro',
      'docs',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      ...restrictedImports([deepRelative]),
    },
  },
  {
    files: ['src/renderer/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { react, 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat['jsx-runtime'].rules,
      ...reactHooks.configs.flat.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      'react/forbid-dom-props': ['error', { forbid: ['style'] }],
      ...restrictedImports(
        [
          { group: ['@main/*'], message: 'The renderer must not import main code.' },
          { group: ['node:*'], message: 'No Node built-ins in the renderer.' },
          deepRelative,
        ],
        [...nodeBuiltins, 'electron', ...networkModules].map((name) => ({ name })),
      ),
      'no-restricted-globals': ['error', ...networkGlobals],
      'no-restricted-syntax': ['error', openExternal, browserWindow, ipcLiteral, audioSyntax],
    },
  },
  {
    files: ['src/renderer/features/**/*.{ts,tsx}'],
    rules: {
      ...restrictedImports(
        [
          { group: ['@main/*'], message: 'The renderer must not import main code.' },
          { group: ['node:*'], message: 'No Node built-ins in the renderer.' },
          { group: ['@renderer/features/*'], message: 'Features must not import other features.' },
          { group: ['../../*'], message: 'Features must not reach across feature folders.' },
          deepRelative,
        ],
        [...nodeBuiltins, 'electron', ...networkModules].map((name) => ({ name })),
      ),
    },
  },
  {
    files: ['src/shared/**/*.ts'],
    languageOptions: { globals: {} },
    rules: {
      ...restrictedImports(
        [
          {
            group: ['@main/*', '@renderer/*', 'node:*'],
            message: 'shared must not import other layers.',
          },
          deepRelative,
        ],
        [...nodeBuiltins, 'electron', 'react', 'react-dom'].map((name) => ({ name })),
      ),
      'no-restricted-globals': [
        'error',
        ...['window', 'document', 'navigator', 'process', 'Buffer', 'fetch'].map((name) => ({
          name,
          message: 'shared code must be environment-neutral.',
        })),
      ],
      'no-restricted-syntax': ['error', ipcLiteral],
    },
  },
  {
    files: ['src/main/**/*.ts'],
    languageOptions: { globals: globals.node },
    rules: {
      ...restrictedImports(
        [{ group: ['@renderer/*'], message: 'main must not import renderer code.' }, deepRelative],
        [forbidElectronNamed, ...networkModules.map((name) => ({ name }))],
      ),
      'no-restricted-syntax': ['error', openExternal, browserWindow, ipcLiteral],
    },
  },
  {
    files: ['src/main/window/create-main-window.ts'],
    rules: { 'no-restricted-syntax': ['error', openExternal, ipcLiteral] },
  },
  {
    files: ['src/preload/**/*.ts'],
    languageOptions: { globals: globals.node },
    rules: {
      ...restrictedImports(
        [
          { group: ['@renderer/*', '@main/*'], message: 'preload may import only shared.' },
          deepRelative,
        ],
        [forbidElectronNamed, ...networkModules.map((name) => ({ name }))],
      ),
      'no-restricted-globals': ['error', ...networkGlobals],
      'no-restricted-syntax': ['error', openExternal, browserWindow, ipcLiteral],
    },
  },
  {
    files: ['src/shared/ipc/channels.ts'],
    rules: { 'no-restricted-syntax': 'off' },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'tests/**', '*.config.{ts,mjs}'],
    languageOptions: { globals: { ...globals.node } },
    rules: {
      'no-restricted-globals': 'off',
      'no-restricted-syntax': 'off',
      ...restrictedImports([deepRelative]),
    },
  },
  prettier,
);
