import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// T6.2 (renderer part): static policy over renderer source, CSS and the HTML entry.
// Traceability: R8.4, R8.7 (no audio or animation yet), R9 (focus), R15.1 (no network), CSP (no inline style).
const root = fileURLToPath(new URL('../..', import.meta.url));
const rendererDir = path.join(root, 'src', 'renderer');

function files(dir: string, test: (name: string) => boolean): string[] {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile() && test(e.name))
    .map((e) => path.join(e.parentPath, e.name));
}
const read = (file: string): string => readFileSync(file, 'utf8');
const stripComments = (s: string): string =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');
const name = (file: string): string => path.relative(root, file).split(path.sep).join('/');

const sources = files(rendererDir, (n) => /\.tsx?$/.test(n) && !/\.(test|d)\.tsx?$/.test(n));
const stylesheets = files(rendererDir, (n) => n.endsWith('.css'));

describe('renderer source policy', () => {
  it('finds the source files it is supposed to police', () => {
    expect(sources.length).toBeGreaterThan(20);
    expect(stylesheets.length).toBeGreaterThan(5);
  });

  it.each([
    [
      'AudioContext or analyser',
      /\b(AudioContext|webkitAudioContext|OfflineAudioContext|AnalyserNode)\b/,
    ],
    ['requestAnimationFrame', /\brequestAnimationFrame\b/],
    ['crashReporter or autoUpdater', /\b(crashReporter|autoUpdater)\b/],
    ['openExternal', /\bopenExternal\b/],
    ['network globals', /\b(fetch\s*\(|XMLHttpRequest|WebSocket|EventSource)\b/],
    ['HTML injection', /\b(dangerouslySetInnerHTML|innerHTML|insertAdjacentHTML|outerHTML)\b/],
    ['dynamic code', /\b(eval\s*\(|new\s+Function\s*\()/],
    ['direct bridge access', /\bipcRenderer\b/],
  ] as const)('contains no %s', (_label, pattern) => {
    // Audio Engine (ADR 0006): Web Audio and the animation loop are confined to src/renderer/audio.
    const audioOnly = _label === 'AudioContext or analyser' || _label === 'requestAnimationFrame';
    const scope = audioOnly
      ? sources.filter((f) => !name(f).startsWith('src/renderer/audio/'))
      : sources;
    const offenders = scope.filter((f) => pattern.test(stripComments(read(f)))).map(name);
    expect(offenders).toEqual([]);
  });

  it('reads window.necroamp only in the bridge adapter (R4.9)', () => {
    const offenders = sources
      .filter((f) => /\.necroamp\b|\bnecroamp\s*:/.test(stripComments(read(f))))
      .map(name)
      .sort();
    expect(offenders).toEqual(['src/renderer/app/bridge/necroamp-client.ts']);
  });

  it('never passes a style prop (strict CSP, no inline style)', () => {
    const offenders = sources
      .filter((f) => /\bstyle\s*=\s*\{/.test(stripComments(read(f))))
      .map(name);
    expect(offenders).toEqual([]);
  });

  it('imports no main, electron, Node built-in or network module', () => {
    const bad =
      /from\s+['"](@main\/[^'"]*|electron|node:[^'"]+|fs|path|os|child_process|http|https|net)['"]/;
    const offenders = sources.filter((f) => bad.test(stripComments(read(f)))).map(name);
    expect(offenders).toEqual([]);
  });

  it('keeps features from importing each other', () => {
    const featureFiles = sources.filter((f) => name(f).startsWith('src/renderer/features/'));
    const offenders: string[] = [];
    for (const f of featureFiles) {
      const own = name(f).split('/')[3];
      for (const m of stripComments(read(f)).matchAll(
        /from\s+['"]@renderer\/features\/([^/'"]+)/g,
      )) {
        if (m[1] !== own) offenders.push(`${name(f)} -> ${m[1] ?? ''}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('renderer stylesheet policy', () => {
  it.each([
    ['remote url()', /url\(\s*['"]?\s*(https?:|\/\/|data:text|javascript:)/i],
    ['@import', /@import\b/i],
    [
      'animation, transition or @keyframes (R9.7)',
      /(@keyframes|\banimation(-[a-z]+)?\s*:|\btransition(-[a-z]+)?\s*:)/i,
    ],
    ['expression() or behavior', /\b(expression\s*\(|behavior\s*:)/i],
    ['external @font-face source', /@font-face[^}]*url\(\s*['"]?https?:/i],
  ] as const)('contains no %s', (_label, pattern) => {
    const offenders = stylesheets.filter((f) => pattern.test(stripComments(read(f)))).map(name);
    expect(offenders).toEqual([]);
  });

  it('never removes the focus indicator without replacing it', () => {
    for (const f of stylesheets) {
      const css = stripComments(read(f));
      for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        const selector = rule[1] ?? '';
        const body = rule[2] ?? '';
        if (/:focus/.test(selector) && /outline\s*:\s*(none|0)\b/.test(body)) {
          expect(body, `${name(f)} ${selector.trim()}`).toMatch(/box-shadow|border|outline-offset/);
        }
      }
    }
  });

  it('defines a visible :focus-visible style that uses the focus token', () => {
    const all = stylesheets.map((f) => stripComments(read(f))).join('\n');
    const rule = /:focus-visible[^{]*\{([^}]*)\}/.exec(all);
    expect(rule, 'a :focus-visible rule must exist').not.toBeNull();
    expect(rule?.[1]).toMatch(/--na-color-focus/);
    expect(rule?.[1]).toMatch(/--na-focus-ring-width/);
  });
});

describe('renderer HTML entry', () => {
  const html = read(path.join(rendererDir, 'index.html'));

  it('declares lang, a title and exactly one external module script', () => {
    expect(html).toMatch(/<html[^>]*\blang="en"/);
    expect(html).toMatch(/<title>NecroAmp<\/title>/);
    const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
    expect(scripts).toHaveLength(1);
    expect(scripts[0]?.[1]).toMatch(/type="module"/);
    expect(scripts[0]?.[1]).toMatch(/\bsrc=/);
    expect(scripts[0]?.[2]?.trim()).toBe('');
  });

  it('has no inline event handler, inline style or remote reference in source', () => {
    expect(html).not.toMatch(/\son[a-z]+\s*=/i);
    expect(html).not.toMatch(/\sstyle\s*=/i);
    expect(html).not.toMatch(/(src|href)\s*=\s*["']?(https?:)?\/\//i);
  });

  it('leaves the CSP meta tag to the build plugin (single source of truth)', () => {
    expect(html).not.toMatch(/http-equiv\s*=\s*["']Content-Security-Policy/i);
  });
});
