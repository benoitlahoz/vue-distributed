import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { builtinModules } from 'node:module';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import manifestSRI from 'vite-plugin-manifest-sri';
import dts from 'vite-plugin-dts';
// @ts-ignore
import pkg from './package.json';

export default () => {
  return defineConfig({
    build: {
      lib: {
        entry: resolve(__dirname, 'src/core/index.ts'),
        name: 'VueDistributed',
      },
      manifest: true,
      emptyOutDir: false,
      minify: 'terser',
      target: 'esnext',
      rollupOptions: {
        output: {
          exports: 'named',
          globals: { vue: 'Vue', vite: 'vite', jszip: 'JSZip' },
        },
        external: [
          'vue',
          'vite',
          'jszip',
          ...builtinModules.flatMap((p) => [p, `node:${p}`]),
        ],
      },
    },
    define: {
      'import.meta.env.VITE_VUE_DISTRIBUTED_VERSION': `"${pkg.version}"`,
    },
    plugins: [
      vue(),
      // Generate a subresource integrity hash for 'umd' version of the bundle.
      manifestSRI(),
      dts({
        rollupTypes: false
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  });
};
