import * as Vue from 'vue';
import { createApp } from 'vue';
import AppGlobalRegister from './AppGlobalRegister.vue';
import AppPluginLoader from './AppPluginLoader.vue';
import { VueDistributed, useRemoteImport } from 'vue-distributed';

const REGISTER_GLOBAL = false;

/**
 * For the example: load one or the other app.
 *
 * When registered globally, the components from the plugin
 * can be used by their own name (e.g. here: joke-component).
 *
 * When registered locally, they must be wrapped in the 'PluginLoader'
 * component's slot, itself the child of a 'Suspense' and can be used
 * via e.g. component(is="JokeComponent"), which can be useful when
 * adding plugins at runtime without restarting the app.
 *
 * The two methods can be used together, but we separated them for
 * the purpose of this example.
 */

const { bootstrap, getPlugin, cleanImports } = useRemoteImport();

if (REGISTER_GLOBAL) {
  // Add Vue to the global scope.
  bootstrap({
    vue: Vue,
    logLevel: 'verbose',
  });

  const app = createApp(AppGlobalRegister);

  // Get vue `Plugin` built by the 'VueDistributed' importer.
  const WidgetsPlugin = await getPlugin(
    'http://localhost:5173/vue-plugin-widgets.umd.js'
  );

  // Tear-down the imported plugins before quitting.
  app.onUnmount(() => cleanImports());
  app.use(VueDistributed).use(WidgetsPlugin).mount('#app');
} else {
  const app = createApp(AppPluginLoader);

  // Tear-down the imported plugins before quitting.
  // Not mandatory if using 'PluginLoader' component at least once.
  app.onUnmount(() => cleanImports());

  app.use(VueDistributed, { logLevel: 'verbose' }).mount('#app');
}
