import type { PluginOption } from 'vite';
import { createHash } from 'crypto';
// @ts-expect-error Will be used by injected code.
import { VueDistributedModuleVersionKey } from '@/vite/build.private';

const VitePluginVueDistributed = (): PluginOption => {
  let entry: string;

  return {
    name: 'vite-plugin-vue-distributed',
    apply: 'build',
    enforce: 'pre',

    config(config) {
      if (!config.build || !config.build.lib || !config.build.lib.entry) {
        throw new Error(`Vue distributed plugin must be built as library.`);
      }

      if (typeof config.build.lib.entry !== 'string') {
        throw new Error(
          `Vue distributed plugin accepts only one entry (string).`
        );
      }

      entry = config.build.lib.entry;
    },

    transform(this: any, src: string, id: string) {
      let code = src;
      if (id === entry) {
        // Warning: do NOT remove, 'vue-distributed' version data will be injected at its build time.
        /**----$_vue-distributed-build-inject_$----**/
      }

      return {
        code,
        map: null,
      };
    },

    renderChunk(this: any, code: string) {
      const idsArray = Array.from(this.getModuleIds());
      const hashInput = `${idsArray.join('')}${Date.now()}`;
      const hash = createHash('sha256').update(hashInput).digest('hex');
      // This string must be hard-coded as this file will be transformed by 'vite-plugin-vue-distributed-internal' on library build.
      code = code.replace('/**----$_plugin-hash-inject_$----**/', hash);

      return {
        code,
        map: null,
      };
    },
  };
};

export { VitePluginVueDistributed as default };
