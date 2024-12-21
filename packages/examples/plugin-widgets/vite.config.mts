import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { definePluginConfig } from 'vue-distributed/vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';

// Only for demo.
import { viteStaticCopy } from 'vite-plugin-static-copy';

// A lightweight configuration with options and plugins used by the library.

export default () =>
  definePluginConfig({
    name: 'vue-plugin-widgets',
    entry: resolve(__dirname, 'src/index.ts'),
    // archive: false, // Archive is true by default.
    external: ['three'],
    plugins: [
      vue(),
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
          {
            src: 'dist/vue-plugin-widgets.umd.js.sri',
            dest: '../../app-vite-serve/public',
          },
          {
            src: 'dist/vue-plugin-widgets.zip',
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
