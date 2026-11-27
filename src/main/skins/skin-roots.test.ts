import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveSkinRoots } from './skin-roots';

describe('resolveSkinRoots', () => {
  it('uses <appPath>/skins in development', () => {
    expect(
      resolveSkinRoots({
        isPackaged: false,
        appPath: path.join('repo'),
        resourcesPath: path.join('res'),
        join: path.join,
      }),
    ).toEqual([path.join('repo', 'skins')]);
  });

  it('uses <resources>/skins when packaged', () => {
    expect(
      resolveSkinRoots({
        isPackaged: true,
        appPath: path.join('repo'),
        resourcesPath: path.join('res'),
        join: path.join,
      }),
    ).toEqual([path.join('res', 'skins')]);
  });

  it.each([undefined, ''])('has no root when packaged without resourcesPath (%j)', (value) => {
    expect(
      resolveSkinRoots({
        isPackaged: true,
        appPath: 'repo',
        resourcesPath: value,
        join: path.join,
      }),
    ).toEqual([]);
  });
});
