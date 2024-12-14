/**
 * This plugin is used to build public vite plugin
 * and inject current version of the package in
 * user's vue plugins at build time.
 */

import type { Plugin } from 'vite';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';

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
          // The 'vue-distributed' package build hash will be injected here.
          loader: '/**----$_vue-distributed-hash-inject_$----**/',
          // The 'vite-plugin-vue-distributed' used to build plugins will inject the plugin hash here.
          pkg: '/**----$_plugin-hash-inject_$----**/',
        };

        const injected = [
          '  ',
          'code = `',
          '${code}',
          '  ',
          'export const ${VueDistributedModuleVersionKey} = ',
          `${JSON.stringify(infoObject, null, 2)};`,
          '`;',
        ];

        const str = injected.join('\n');
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

    renderChunk(this: any, code: string) {
      // Create a hash with all ids and date.

      const idsArray = Array.from(this.getModuleIds());
      const hashInput = `${idsArray.join('')}${Date.now()}`;
      const hash = createHash('sha256').update(hashInput).digest('hex');

      // Replace the line we injected in 'transform'.
      code = code.replace(
        '/**----$_vue-distributed-hash-inject_$----**/',
        hash
      );

      return {
        code,
        map: null,
      };
    },
  };
};

export { plugin as default };
