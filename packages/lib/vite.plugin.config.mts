import { resolve } from 'node:path';
import { builtinModules } from 'node:module';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import VitePluginInternal from './private/vite-plugin-vue-distributed-internal';

export default () => {
  return defineConfig({
    build: {
      lib: {
        formats: ['es', 'cjs'],
        entry: resolve(__dirname, 'src/vite/index.ts'),
        fileName: 'vite-plugin-vue-distributed',
      },
      emptyOutDir: false,
      minify: 'terser',
      target: 'esnext',
      rollupOptions: {
        external: [
          'vue',
          'vite',
          '@vitejs/plugin-vue',
          'vite-plugin-css-injected-by-js',
          '@rollup/plugin-image',
          ...builtinModules.flatMap((p) => [p, `node:${p}`]),
        ],
      },
    },
    plugins: [VitePluginInternal(), dts()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  });
};
