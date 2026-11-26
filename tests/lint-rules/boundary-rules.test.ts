import { Linter } from 'eslint';
import { describe, expect, it } from 'vitest';
// @ts-expect-error The flat config is a plain .mjs module without type declarations.
import config from '../../eslint.config.mjs';

// T6.2: every boundary rule in eslint.config.mjs must fail on a fixture (R2, R4.1, R6.5, R15.1).
// Fixtures are in-memory strings, so nothing touches the filesystem.
const linter = new Linter({ configType: 'flat', cwd: process.cwd() });

function rulesFor(code: string, filename: string): string[] {
  const messages = linter.verify(code, config as Linter.Config[], { filename });
  return messages.filter((m) => m.ruleId !== null).map((m) => m.ruleId as string);
}
function fatal(code: string, filename: string): string[] {
  return linter
    .verify(code, config as Linter.Config[], { filename })
    .filter((m) => m.fatal)
    .map((m) => m.message);
}

const RESTRICTED_IMPORT = 'no-restricted-imports';
const RESTRICTED_SYNTAX = 'no-restricted-syntax';
const RESTRICTED_GLOBALS = 'no-restricted-globals';

describe('eslint boundary rules reject violating fixtures', () => {
  it.each([
    [
      'renderer imports main',
      'src/renderer/a.ts',
      "import { x } from '@main/ipc/install-ipc';\nexport const y = x;\n",
      RESTRICTED_IMPORT,
    ],
    [
      'renderer imports electron',
      'src/renderer/a.ts',
      "import { ipcRenderer } from 'electron';\nexport const y = ipcRenderer;\n",
      RESTRICTED_IMPORT,
    ],
    [
      'renderer imports a node built-in',
      'src/renderer/a.ts',
      "import fs from 'node:fs';\nexport const y = fs;\n",
      RESTRICTED_IMPORT,
    ],
    [
      'renderer imports a network module',
      'src/renderer/a.ts',
      "import http from 'https';\nexport const y = http;\n",
      RESTRICTED_IMPORT,
    ],
    [
      'renderer uses a deep relative import',
      'src/renderer/a.ts',
      "import { x } from '../../../shared/x';\nexport const y = x;\n",
      RESTRICTED_IMPORT,
    ],
    [
      'feature imports another feature',
      'src/renderer/features/player/a.ts',
      "import { x } from '@renderer/features/playlist';\nexport const y = x;\n",
      RESTRICTED_IMPORT,
    ],
    [
      'feature reaches across folders',
      'src/renderer/features/player/a.ts',
      "import { x } from '../../playlist/x';\nexport const y = x;\n",
      RESTRICTED_IMPORT,
    ],
    [
      'shared imports main',
      'src/shared/a.ts',
      "import { x } from '@main/x';\nexport const y = x;\n",
      RESTRICTED_IMPORT,
    ],
    [
      'shared imports electron',
      'src/shared/a.ts',
      "import { app } from 'electron';\nexport const y = app;\n",
      RESTRICTED_IMPORT,
    ],
    [
      'shared imports a node built-in',
      'src/shared/a.ts',
      "import path from 'path';\nexport const y = path;\n",
      RESTRICTED_IMPORT,
    ],
    [
      'shared imports react',
      'src/shared/a.ts',
      "import { useState } from 'react';\nexport const y = useState;\n",
      RESTRICTED_IMPORT,
    ],
    [
      'main imports renderer',
      'src/main/a.ts',
      "import { x } from '@renderer/x';\nexport const y = x;\n",
      RESTRICTED_IMPORT,
    ],
    [
      'main imports crashReporter',
      'src/main/a.ts',
      "import { crashReporter } from 'electron';\nexport const y = crashReporter;\n",
      RESTRICTED_IMPORT,
    ],
    [
      'main imports autoUpdater',
      'src/main/a.ts',
      "import { autoUpdater } from 'electron';\nexport const y = autoUpdater;\n",
      RESTRICTED_IMPORT,
    ],
    [
      'main imports electron net',
      'src/main/a.ts',
      "import { net } from 'electron';\nexport const y = net;\n",
      RESTRICTED_IMPORT,
    ],
    [
      'main imports node:https',
      'src/main/a.ts',
      "import https from 'node:https';\nexport const y = https;\n",
      RESTRICTED_IMPORT,
    ],
    [
      'preload imports main',
      'src/preload/a.ts',
      "import { x } from '@main/x';\nexport const y = x;\n",
      RESTRICTED_IMPORT,
    ],
    [
      'preload imports renderer',
      'src/preload/a.ts',
      "import { x } from '@renderer/x';\nexport const y = x;\n",
      RESTRICTED_IMPORT,
    ],
    [
      'preload imports electron-updater',
      'src/preload/a.ts',
      "import u from 'electron-updater';\nexport const y = u;\n",
      RESTRICTED_IMPORT,
    ],
    [
      'any file uses a deep relative import',
      'src/main/a.ts',
      "import { x } from '../../../x';\nexport const y = x;\n",
      RESTRICTED_IMPORT,
    ],
  ] as const)('%s', (_label, filename, code, rule) => {
    expect(rulesFor(code, filename)).toContain(rule);
  });

  it.each([
    [
      'renderer opens an external link',
      'src/renderer/a.ts',
      'declare const shell: { openExternal(u: string): void };\nshell.openExternal("https://x.test");\n',
      RESTRICTED_SYNTAX,
    ],
    [
      'renderer creates a window',
      'src/renderer/a.ts',
      'declare class BrowserWindow {}\nexport const w = new BrowserWindow();\n',
      RESTRICTED_SYNTAX,
    ],
    [
      'renderer uses a literal IPC channel',
      'src/renderer/a.ts',
      "declare const r: { invoke(c: string): void };\nr.invoke('app:get-info');\n",
      RESTRICTED_SYNTAX,
    ],
    [
      'renderer uses AudioContext',
      'src/renderer/a.ts',
      'declare const AudioContext: new () => object;\nexport const c = new AudioContext();\n',
      RESTRICTED_SYNTAX,
    ],
    [
      'renderer uses requestAnimationFrame',
      'src/renderer/a.ts',
      'requestAnimationFrame(() => undefined);\n',
      RESTRICTED_SYNTAX,
    ],
    [
      'main opens an external link',
      'src/main/a.ts',
      'declare const shell: { openExternal(u: string): void };\nshell.openExternal("https://x.test");\n',
      RESTRICTED_SYNTAX,
    ],
    [
      'main creates a window outside create-main-window',
      'src/main/a.ts',
      'declare class BrowserWindow {}\nexport const w = new BrowserWindow();\n',
      RESTRICTED_SYNTAX,
    ],
    [
      'main registers a literal channel',
      'src/main/a.ts',
      "declare const ipcMain: { handle(c: string, f: () => void): void };\nipcMain.handle('library:scan', () => undefined);\n",
      RESTRICTED_SYNTAX,
    ],
    [
      'shared uses a literal channel',
      'src/shared/a.ts',
      "declare const x: { handle(c: string): void };\nx.handle('app:get-info');\n",
      RESTRICTED_SYNTAX,
    ],
    [
      'preload creates a window',
      'src/preload/a.ts',
      'declare class BrowserWindow {}\nexport const w = new BrowserWindow();\n',
      RESTRICTED_SYNTAX,
    ],
    [
      'preload invokes a literal channel',
      'src/preload/a.ts',
      "declare const r: { invoke(c: string): void };\nr.invoke('app:get-info');\n",
      RESTRICTED_SYNTAX,
    ],
    [
      'create-main-window opens an external link',
      'src/main/window/create-main-window.ts',
      'declare const shell: { openExternal(u: string): void };\nshell.openExternal("https://x.test");\n',
      RESTRICTED_SYNTAX,
    ],
  ] as const)('%s', (_label, filename, code, rule) => {
    expect(rulesFor(code, filename)).toContain(rule);
  });

  it.each([
    ['renderer calls fetch', 'src/renderer/a.ts', 'void fetch("https://x.test");\n'],
    [
      'renderer uses XMLHttpRequest',
      'src/renderer/a.ts',
      'export const x = new XMLHttpRequest();\n',
    ],
    [
      'renderer uses WebSocket',
      'src/renderer/a.ts',
      'export const x = new WebSocket("wss://x.test");\n',
    ],
    ['preload calls fetch', 'src/preload/a.ts', 'void fetch("https://x.test");\n'],
    ['shared touches window', 'src/shared/a.ts', 'export const w = window;\n'],
    ['shared touches process', 'src/shared/a.ts', 'export const p = process;\n'],
  ] as const)('%s', (_label, filename, code) => {
    expect(rulesFor(code, filename)).toContain(RESTRICTED_GLOBALS);
  });

  it('renderer rejects the inline style prop', () => {
    const code = 'export const A = () => <div style={{ color: "red" }} />;\n';
    expect(rulesFor(code, 'src/renderer/a.tsx')).toContain('react/forbid-dom-props');
  });

  it('renderer enforces jsx-a11y rules', () => {
    const code = 'export const A = () => <img src="x.png" />;\n';
    expect(rulesFor(code, 'src/renderer/a.tsx')).toContain('jsx-a11y/alt-text');
  });

  it('rejects any and unconsumed type imports project-wide', () => {
    expect(rulesFor('export const x: any = 1;\n', 'src/main/a.ts')).toContain(
      '@typescript-eslint/no-explicit-any',
    );
    expect(
      rulesFor("import { Linter } from 'eslint';\nexport type T = Linter;\n", 'src/main/a.ts'),
    ).toContain('@typescript-eslint/consistent-type-imports');
  });
});

describe('eslint boundary rules accept compliant fixtures (no false positives)', () => {
  it.each([
    [
      'renderer imports shared via alias',
      'src/renderer/a.ts',
      "import type { Platform } from '@shared/ipc';\nexport type P = Platform;\n",
    ],
    [
      'feature imports the shared components barrel',
      'src/renderer/features/player/a.ts',
      "import { RegionFrame } from '@renderer/components/region-frame';\nexport const R = RegionFrame;\n",
    ],
    [
      'main imports shared and a sibling',
      'src/main/a.ts',
      "import { IPC_CHANNELS } from '@shared/ipc';\nexport const c = IPC_CHANNELS;\n",
    ],
    [
      'preload imports electron and shared',
      'src/preload/a.ts',
      "import { contextBridge } from 'electron';\nimport { IPC_CHANNELS } from '@shared/ipc';\nexport const x = [contextBridge, IPC_CHANNELS];\n",
    ],
    [
      'create-main-window may construct a window',
      'src/main/window/create-main-window.ts',
      'declare class BrowserWindow {}\nexport const w = new BrowserWindow();\n',
    ],
    [
      'channels.ts may hold literal channel names',
      'src/shared/ipc/channels.ts',
      "declare const x: { handle(c: string): void };\nx.handle('app:get-info');\n",
    ],
  ] as const)('%s', (_label, filename, code) => {
    const found = rulesFor(code, filename).filter(
      (r) => r.startsWith('no-restricted') || r.startsWith('@typescript-eslint/consistent'),
    );
    expect(found).toEqual([]);
    expect(fatal(code, filename)).toEqual([]);
  });
});
