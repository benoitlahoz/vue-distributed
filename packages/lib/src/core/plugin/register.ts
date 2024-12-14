import type { Ref } from 'vue';
import { ref } from 'vue';
import type { VueDistributedBuild } from '@/vite/build.private';
import type {
  VuePluginComponent,
  VuePluginDefinition,
  VuePluginRegistered,
} from '@/core/types';
import { getNameFromURL, intersects, VueDistributedLogger } from '@/core/utils';
import { formatComponent, formatDescription } from '@/core/formatters';

// Keep a reactive cache of registered plugins.
export const registeredPlugins: Ref<VuePluginRegistered[]> = ref([]);

/**
 * Registers an imported plugin.
 *
 * @param { string } path The path the plugin was loaded from (e.g. URL).
 * @param { VuePluginDefinition } plugin The definition exported by the loaded plugin.
 * @param { VueDistributedBuild } build The 'build' info of the 'vue-distributed' library used to compile the plugin.
 * @param { VueDistributedLogger } logger The logger to use.
 * @returns { VuePluginRegistered } The registered plugin definition.
 */
export const registerPlugin = (
  path: string,
  plugin: VuePluginDefinition,
  build: VueDistributedBuild,
  logger: VueDistributedLogger
) => {
  const components: VuePluginComponent[] = [];
  for (const component of plugin.components || []) {
    try {
      // Try to convert from 'Component' to 'VuePluginComponent'...

      const converted = formatComponent(component, logger);
      if (converted) {
        components.push(converted);
      } else {
        logger.warn(
          `An object passed as component in loaded module is neither a 'Component' or a 'VuePluginComponent'.`
        );

        continue;
      }
    } catch (err: unknown) {
      // ... but won't throw in case object is not conform, to allow other objects to be loaded.

      const message =
        err && (err as any).message ? (err as any).message : undefined;

      logger.warn(message || `An unexpected error occurred.`);

      continue;
    }
  }

  const names = components.map(
    (component: VuePluginComponent) => component.name
  );
  const registered = getComponentsNames();

  const overlappoing = intersects(names, registered);

  if (overlappoing.length > 0) {
    logger.warn(
      `Components '${overlappoing.join(
        ', '
      )}' were already registered. The new implementation will replace existing one.`
    );
  }

  const description = formatDescription(plugin.description || {}, logger);
  const definition: VuePluginRegistered = {
    path,
    loaded: Date.now(),
    ...plugin,
    description,
    components,
    __build: build,
  };

  // Secure the definition.
  Object.freeze(definition);

  // Cache it.
  registeredPlugins.value.push(definition);

  return definition;
};

export const getComponents = () =>
  registeredPlugins.value
    .map((plugin: VuePluginRegistered) => plugin.components)
    .flat();

export const getComponentsNames = () =>
  registeredPlugins.value
    .map((plugin: VuePluginRegistered) =>
      plugin.components.map((component: VuePluginComponent) => component.name)
    )
    .flat(2);

export const emptyRegisteredPlugins = () => {
  registeredPlugins.value.length = 0;
};

export const pluginByURL = (url: string): VuePluginRegistered | undefined => {
  const name = getNameFromURL(url);
  return registeredPlugins.value.find(
    (plugin: VuePluginRegistered) => getNameFromURL(plugin.path) === name
  );
};
