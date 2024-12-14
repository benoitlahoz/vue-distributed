import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { builtinModules } from 'node:module';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
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
      emptyOutDir: false,
      minify: 'terser',
      target: 'esnext',
      rollupOptions: {
        output: {
          exports: 'named',
          globals: { vue: 'Vue', vite: 'vite' },
        },
        external: [
          'vue',
          'vite',
          ...builtinModules.flatMap((p) => [p, `node:${p}`]),
        ],
      },
    },
    define: {
      'import.meta.env.VITE_VUE_DISTRIBUTED_VERSION': `"${pkg.version}"`,
    },
    plugins: [vue(), dts()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  });
};
