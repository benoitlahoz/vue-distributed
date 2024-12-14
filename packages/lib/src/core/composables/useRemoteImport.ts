import * as Vue from 'vue';
import type { Plugin, Ref } from 'vue';
import { ref } from 'vue';
import type {
  VuePluginRegistered,
  VuePluginVersionCompare,
} from '@/core/types';
import type {
  VueDistributedLogger,
  VueDistributedLoggerLevel,
} from '@/core/utils';
import {
  NoOp,
  createLogger,
  isNewerVersion,
  isOlderVersion,
} from '@/core/utils';
import { cleanImportedModules } from '@/core/importers';
import {
  registeredPlugins,
  emptyRegisteredPlugins,
  getComponents,
  getComponentsNames,
  pluginByURL,
  getPluginByURL,
} from '@/core/plugin';

export interface VueDistributedBootstrapOptions {
  vue?: typeof Vue;
  logLevel?: keyof typeof VueDistributedLoggerLevel;
}

const DefaultBootstrapOptions: VueDistributedBootstrapOptions = {
  vue: Vue,
  logLevel: 'verbose',
};

// Default logger.
let logger: VueDistributedLogger = createLogger('verbose');

// Global bootstrap.
let bootstrapped: Ref<boolean> = ref(false);
let bootstrap = (options: VueDistributedBootstrapOptions = {}) => {
  const opts = {
    ...DefaultBootstrapOptions,
    ...options,
  };

  // Create logger.
  logger = createLogger(opts.logLevel);

  if (typeof (window as any).Vue !== 'undefined') {
    logger.warn(`Vue was already added to the global scope. Replacing...`);
  }

  // Externalize Vue for the plugins to work.
  (window as any).Vue = opts.vue;

  // Can be called only once.
  bootstrap = NoOp;
};

export const useRemoteImport = () => {
  /**
   * Get the 'install' function of the imported plugin.
   * Will warn if the function does not exist and try to build one.
   *
   * @param { string } url The URL from where we import the plugin.
   * @returns { { install: (app: App) => void } } The 'install' function, or a NoOp if nothing is exported by the plugin.
   */
  const getPlugin = async (url: string): Promise<Plugin> => {
    // Bootstrap with default options if it was not done before by using plugin.
    ensureBootstrap();

    // Get plugin by URL.
    return getPluginByURL(url, logger);

    // TODO: 'gePluginByIpcChannel' for 'electron'.
  };

  const isComponentRegistered = (name: string) =>
    getComponentsNames().includes(name);

  const cleanImports = () => {
    cleanImportedModules();
    emptyRegisteredPlugins();
  };

  /**
   * Get current version of the library by reading the env.
   * If user chose to prefix its vite build with another prefix
   * it could break: untested.
   *
   * @returns { string | null } The version of the library.
   * @todo Test with another vite 'env' prefix.
   */
  const getLibVersion = (): string =>
    import.meta.env.VITE_VUE_DISTRIBUTED_VERSION || '0.0.0';

  const compareVersion = (
    plugin: VuePluginRegistered
  ): VuePluginVersionCompare => {
    let ret: VuePluginVersionCompare;

    try {
      const libVersion = getLibVersion();
      const pluginVersion = plugin.__build.version;

      const isPluginNewer = isNewerVersion(libVersion, pluginVersion);
      const isPluginOlder = isOlderVersion(libVersion, pluginVersion);

      if (isPluginNewer) {
        ret = {
          library: libVersion,
          plugin: pluginVersion,
          state: 'newer',
        };
      } else if (isPluginOlder) {
        ret = {
          library: libVersion,
          plugin: pluginVersion,
          state: 'older',
        };
      } else {
        ret = {
          library: libVersion,
          plugin: pluginVersion,
          state: 'equal',
        };
      }
    } catch (err: unknown) {
      logger.warn(`An unexpected error occurred when comparing versions.`);
      logger.error(err);

      ret = {
        library: '0.0.0',
        plugin: '0.0.0',
        state: 'unknown',
      };
    }

    return ret;
  };

  return {
    bootstrap,
    createLogger,
    logger,

    getPlugin,
    getComponents,
    getComponentsNames,
    getLibVersion,

    pluginByURL,
    compareVersion,

    registeredPlugins,

    isComponentRegistered,

    cleanImports,
  };
};

const ensureBootstrap = () => {
  if (!bootstrapped.value) {
    bootstrap();
  }
};
