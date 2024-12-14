import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { definePluginConfig } from 'vue-distributed/vite';
import dts from 'vite-plugin-dts';

// Only for demo.
import { viteStaticCopy } from 'vite-plugin-static-copy';

// A lightweight configuration with options and plugins used by the library.

export default () =>
  definePluginConfig({
    name: 'vue-plugin-widgets',
    entry: resolve(__dirname, 'src/index.ts'),
    external: ['three'],
    plugins: [
      dts({
        rollupTypes: true,
        insertTypesEntry: true,
      }),

      // Only for this example executed in the monorepo, to allow preview.
      // Remove in production.

      viteStaticCopy({
        targets: [
          {
            src: 'dist/vue-plugin-widgets.umd.js',
            dest: '../../app-vite-serve/public',
          },
        ],
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  });
/*

// With usual 'vite' config.

import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import injectCss from 'vite-plugin-css-injected-by-js';
import injectImages from '@rollup/plugin-image';
import VitePluginVueDistributed from 'vue-distributed/vite';

export default () => {
  return defineConfig({
    build: {
      lib: {
        formats: ['umd'],
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'vue-plugin-widgets',
      },
      minify: 'terser',
      target: 'esnext',
      rollupOptions: {
        output: {
          exports: 'named',
          globals: {
            vue: 'Vue',
            'vue-plugin-widgets': 'vue-plugin-widgets',
          },
        },
        external: ['vue', 'vue-distributed'],
      },
    },
    plugins: [
      VitePluginVueDistributed(),
      vue(),
      injectImages(),
      injectCss(),

      dts({
        rollupTypes: true,
        insertTypesEntry: true,
      }),

      // Only for this example executed in the monorepo, to allow preview.
      // Remove in production.

      viteStaticCopy({
        targets: [
          {
            src: 'dist/vue-plugin-widgets.umd.js',
            dest: '../../app-vite-serve/public',
          },
        ],
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  });
};
*/
