/**
 * A very lightweight vite configuration for distributed vue plugins.
 */

import type {
  AliasOptions,
  ESBuildOptions,
  LibraryFormats,
  PluginOption,
  ResolveOptions,
} from 'vite';
import { defineConfig } from 'vite';
import injectCss from 'vite-plugin-css-injected-by-js';
import injectImages from '@rollup/plugin-image';
import VitePluginVueDistributed from './vite-plugin-vue-distributed/vite-plugin-vue-distributed';

type AllResolveOptions = ResolveOptions & {
  alias?: AliasOptions;
};

export interface VueDistributedPluginConfig {
  name: string;
  entry: string;
  formats?:LibraryFormats[];
  external?: string[];
  globals?: Record<string, string>;
  inject?: {
    css?: false | undefined;
    images?: false | undefined;
  };
  minify?: false | undefined;
  archive?: false;
  plugins?: PluginOption[];
  resolve?: AllResolveOptions;
  esbuild?: false | ESBuildOptions | undefined;
}

const viteConfig = (config: VueDistributedPluginConfig) => {
  const cleanName = config.name.trim();
  const plugins = config.plugins || [];
  const archive = config.archive === false ? false : true;
  const minify = config.minify === false ? undefined : 'terser';
  const formats = config.formats || ['umd']

  return defineConfig({
    build: {
      lib: {
        formats,
        entry: config.entry,
        name: cleanName,
      },
      minify,
      target: 'esnext',
      rollupOptions: {
        output: {
          exports: 'named',
          globals: {
            vue: 'Vue',
            [cleanName]: cleanName,
            ...(config.globals || {}),
          },
        },
        external: ['vue', 'vue-distributed', ...(config.external || [])],
      },
    },
    plugins: [
      VitePluginVueDistributed({
        archive,
      }),
      typeof config.inject?.images === 'undefined' ? injectImages() : undefined,
      typeof config.inject?.css === 'undefined' ? injectCss() : undefined,

      // User defined plugins.
      ...plugins,
    ],
    resolve: config.resolve || {},
    esbuild: config.esbuild,
  });
};

export const definePluginConfig = (config: VueDistributedPluginConfig) => {
  return viteConfig(config);
};
