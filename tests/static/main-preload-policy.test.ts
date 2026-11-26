import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Subset of T6.2 for M2/M3 source: static policy checks over non-test source.
const root = fileURLToPath(new URL('../..', import.meta.url));

function sourceFiles(dir: string): string[] {
  return readdirSync(path.join(root, dir), { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile() && /\.ts$/.test(e.name) && !/\.(test|d)\.ts$/.test(e.name))
    .map((e) => path.join(e.parentPath, e.name));
}
const read = (file: string) => readFileSync(file, 'utf8');
const stripComments = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const mainFiles = sourceFiles('src/main');
const preloadFiles = sourceFiles('src/preload');
const sharedFiles = sourceFiles('src/shared');

describe('main/preload/shared source policy', () => {
  it('constructs a BrowserWindow only in create-main-window.ts', () => {
    const offenders = [...mainFiles, ...preloadFiles, ...sharedFiles].filter((f) =>
      /new\s+BrowserWindow\s*\(/.test(stripComments(read(f))),
    );
    expect(offenders.map((f) => path.basename(f))).toEqual(['create-main-window.ts']);
  });

  it('never references forbidden capabilities in main, preload or shared', () => {
    const forbidden =
      /\b(openExternal|crashReporter|autoUpdater|AudioContext|requestAnimationFrame|fetch\s*\(|XMLHttpRequest|WebSocket|dangerouslySetInnerHTML)\b/;
    const importsNet = /from\s+['"](node:)?(net|http|https|undici|electron-updater)['"]/;
    for (const file of [...mainFiles, ...preloadFiles, ...sharedFiles]) {
      const code = stripComments(read(file));
      expect(forbidden.test(code), path.basename(file)).toBe(false);
      expect(importsNet.test(code), path.basename(file)).toBe(false);
    }
  });

  it('has no literal channel names outside src/shared/ipc/channels.ts', () => {
    const literal = /['"`]app:get-info['"`]/;
    for (const file of [...mainFiles, ...preloadFiles, ...sharedFiles]) {
      if (file.endsWith(path.join('ipc', 'channels.ts'))) continue;
      expect(literal.test(stripComments(read(file))), path.basename(file)).toBe(false);
    }
  });

  it('never sets a mandatory web preference to its insecure value', () => {
    const insecure =
      /(contextIsolation\s*:\s*false|sandbox\s*:\s*false|nodeIntegration\s*:\s*true|webSecurity\s*:\s*false|allowRunningInsecureContent\s*:\s*true|webviewTag\s*:\s*true)/;
    for (const file of mainFiles) {
      expect(insecure.test(stripComments(read(file))), path.basename(file)).toBe(false);
    }
  });

  it('shared code imports no Electron, DOM-only or Node built-in module', () => {
    for (const file of sharedFiles) {
      const code = stripComments(read(file));
      expect(
        /from\s+['"](electron|node:[^'"]+|fs|path|os|child_process)['"]/.test(code),
        path.basename(file),
      ).toBe(false);
    }
  });

  it('the preload never exposes ipcRenderer or a generic sender through contextBridge', () => {
    const index = stripComments(read(path.join(root, 'src/preload/index.ts')));
    expect(index.match(/exposeInMainWorld\(/g)).toHaveLength(1);
    expect(index).toMatch(/exposeInMainWorld\('necroamp',\s*api\)/);
    const factory = stripComments(read(path.join(root, 'src/preload/create-necroamp-api.ts')));
    expect(factory).not.toMatch(/ipcRenderer|require\(|process\b|from\s+['"]electron['"]/);
  });

  it('ipcMain.handle is called only from register-handler.ts', () => {
    const callers = mainFiles.filter((f) =>
      /ipcMain\.(handle|on|once)\s*\(/.test(stripComments(read(f))),
    );
    expect(callers.map((f) => path.basename(f))).toEqual(['register-handler.ts']);
  });

  it('the production CSP is built from a path that never reads the environment', () => {
    for (const name of ['csp.ts', 'trusted-origins.ts']) {
      const code = stripComments(read(path.join(root, 'src/main/security', name)));
      expect(code).not.toMatch(/process\.env|ELECTRON_RENDERER_URL|NODE_ENV/);
    }
  });
});
