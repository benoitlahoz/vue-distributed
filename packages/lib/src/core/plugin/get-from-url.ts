import type { Plugin } from 'vue';
import type { VueDistributedBuild } from '@/vite/build.private';
import { VueDistributedModuleVersionKey } from '@/vite/build.private';
import type { VuePluginRegistered } from '@/core/types';
import type { VueDistributedLogger } from '@/core/utils';
import { cleanURL, NoOpPlugin } from '@/core/utils';
import { importModuleFromURL } from '../importers/url-importer';
import { pluginByURL, registerPlugin } from './register';
import { buildInstall } from '../vue-install';

// Cache installed plugins ids (hash generated on build): vue doesn't export its own cache.
const installedPluginsIds: Set<string> = new Set();

/**
 * Get the 'install' function of the imported plugin.
 * Will warn if the function does not exist and try to build one.
 *
 * @param { string } url The URL from where we import the plugin.
 * @returns { { install: (app: App) => void } } The 'install' function, or a NoOp if nothing is exported by the plugin.
 */
export const getPluginByURL = async (
  url: string,
  logger: VueDistributedLogger
): Promise<Plugin> => {
  // Clean URL.
  const http = cleanURL(url);

  try {
    const existing = pluginByURL(http);
    if (existing) {
      logger.warn(`A plugin was already loaded with url '${http}'.`);

      // We don't know if the plugin has been installed ('use'd) by Vue, but it already has been imported:
      // return a 'Plugin' but don't add it to scripts/cache...
      return buildInstall(existing, installedPluginsIds, logger);
    }

    const module: any = await importModuleFromURL(http);
    const imported = module ? module.plugin || module.default : undefined;

    if (imported) {
      // Get internal build definitions.

      const build: VueDistributedBuild = module[VueDistributedModuleVersionKey];

      // Cache the plugin definition.

      const plugin: VuePluginRegistered = registerPlugin(
        http,
        imported,
        build,
        logger
      );

      // Build an install function.

      return buildInstall(plugin, installedPluginsIds, logger);
    } else {
      logger.warn(
        `Library at path '${url}' doesn't export a value for 'plugin' or 'default'. Returning empty install function.`
      );
    }
  } catch (err: unknown) {
    logger.error(err);
    logger.warn(`Module couldn't be imported from '${url}'.`);
  }

  return NoOpPlugin;
};
