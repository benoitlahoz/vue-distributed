import type { App } from 'vue';
import type { VuePluginRegistered } from '@/core/types';
import type { VueDistributedLogger } from '@/core/utils';

export const buildInstall = (
  plugin: VuePluginRegistered,
  installed: Set<string>,
  logger: VueDistributedLogger
) => {
  return {
    install: (app: App) => {
      logger.info(`Importing plugin with url ${plugin.path}.`);

      if (installed.has(plugin.__build.pkg)) {
        logger.warn(
          `Plugin loaded with id '${plugin.__build.pkg}' is already installed.`
        );
        return;
      }
      for (const component of plugin.components) {
        app.component(component.name, component.export);
      }

      // TODO: dynamic directives
      // see https://v2.vuejs.org/v2/guide/custom-directive.html#Dynamic-Directive-Arguments
      // We should wrap all directive in one of ours, that takes the final directive name as parameter
      // and check if present.
      for (const directive of plugin.directives || []) {
        app.directive(directive.name, directive.export);
      }

      // Cache the plugin's hash, to avoid multiple installations.
      installed.add(plugin.__build.pkg);
    },
  };
};
