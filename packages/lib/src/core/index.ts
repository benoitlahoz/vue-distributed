import type { App } from 'vue';
import { VueAppInjectionKey } from '@/core/types';
import type { VueDistributedBootstrapOptions } from '@/core/composables';
import { useRemoteImport } from '@/core/composables';

import PluginLoader from '@/core/components/PluginLoader.vue';
import TryComponent from '@/core/components/TryComponent.vue';

const plugin = {
  install(app: App, options?: VueDistributedBootstrapOptions) {
    const { bootstrap } = useRemoteImport();
    bootstrap(options);

    // Make 'app' available anywhere.
    app.provide(VueAppInjectionKey, app);

    // Install library components.
    app.component('PluginLoader', PluginLoader);
    app.component('TryComponent', TryComponent);
  },
};

export { plugin as VueDistributed };

export { useRemoteImport };
export * from './types';
