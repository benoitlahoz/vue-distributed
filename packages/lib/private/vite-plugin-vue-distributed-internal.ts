/**
 * This plugin is used to build public vite plugin
 * and inject current version of the package in
 * user's vue plugins at build time.
 */

import type { Plugin } from 'vite';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';

interface PackageData {
  version?: string;
  author?: string | Record<string, string>;
}

let packageCached: PackageData | null = null;

const loadPackageData = (root = process.cwd()): PackageData | null => {
  if (packageCached) return packageCached;
  const pkg = join(root, 'package.json');
  if (existsSync(pkg)) {
    const _require = createRequire(import.meta.url);
    const data = _require(pkg);

    packageCached = {
      version: data.version,
      author: data.author,
    };
    return packageCached;
  }
  return null;
};

const plugin = (): Plugin => {
  return {
    name: 'add-vue-distributed-object',
    apply: 'build',
    enforce: 'pre',

    transform: (src, id) => {
      let code = src;
      if (id.endsWith('vite-plugin-vue-distributed.ts')) {
        const infoObject = {
          ...loadPackageData(),
        };

        const str = `build: ${JSON.stringify(infoObject, null, 2)},`
        code = code.replace(
          '/**----$_vue-distributed-build-inject_$----**/',
          str
        );
      }
      return {
        code,
        map: null,
      };
    },
  };
};

export { plugin as default };
