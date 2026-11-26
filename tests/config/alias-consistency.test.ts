import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import electronViteConfig from '../../electron.vite.config';
import { alias as vitestAlias } from '../../vitest.config';

const root = fileURLToPath(new URL('../..', import.meta.url));

interface TsConfig {
  compilerOptions?: { paths?: Record<string, string[]> };
}

function readTsPaths(file: string): Record<string, string> {
  const parsed = JSON.parse(readFileSync(path.join(root, file), 'utf8')) as TsConfig;
  const paths = parsed.compilerOptions?.paths ?? {};
  const out: Record<string, string> = {};
  for (const [key, targets] of Object.entries(paths)) {
    const target = targets[0];
    if (target === undefined) continue;
    // "@shared/*" -> "@shared", "./src/shared/*" -> absolute src/shared
    out[key.replace(/\/\*$/, '')] = path.resolve(root, target.replace(/\/\*$/, ''));
  }
  return out;
}

function normalize(table: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of Object.keys(table).sort()) {
    out[key] = path.resolve(table[key] as string);
  }
  return out;
}

function viteAliasOf(target: 'main' | 'preload' | 'renderer'): Record<string, string> {
  const section = (electronViteConfig as Record<string, unknown>)[target] as {
    resolve?: { alias?: Record<string, string> };
  };
  return section.resolve?.alias ?? {};
}

describe('alias tables (R2.2)', () => {
  const reference = normalize(vitestAlias);

  it('defines exactly the three approved aliases', () => {
    expect(Object.keys(reference)).toEqual(['@main', '@renderer', '@shared']);
  });

  it.each(['main', 'preload', 'renderer'] as const)(
    'electron-vite %s alias equals the Vitest alias',
    (target) => {
      expect(normalize(viteAliasOf(target))).toEqual(reference);
    },
  );

  // Project tsconfigs expose only the aliases their boundary may import
  // (renderer has no @main, preload only @shared). Each entry must still map
  // to the reference path, and the tests project carries the full table.
  const expectedKeys: Record<string, string[]> = {
    'tsconfig.shared.json': ['@shared'],
    'tsconfig.preload.json': ['@shared'],
    'tsconfig.main.json': ['@main', '@shared'],
    'tsconfig.renderer.json': ['@renderer', '@shared'],
    'tsconfig.tests.json': ['@main', '@renderer', '@shared'],
  };

  it.each(Object.entries(expectedKeys))('%s paths map to the reference table', (file, keys) => {
    const paths = normalize(readTsPaths(file));
    expect(Object.keys(paths).sort()).toEqual(keys);
    for (const key of keys) {
      expect(paths[key]).toBe(reference[key]);
    }
  });
});
