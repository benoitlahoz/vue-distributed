import type { App } from 'vue';
import { ContextInjectionKey, VueDistributedPluginOptions } from '@/core/types';
import { Context } from '@/core/internal';
import { useRemoteImport } from '@/core/composables';

import PluginLoader from '@/core/components/PluginLoader.vue';
import TryComponent from '@/core/components/TryComponent.vue';

const plugin = {
  install(app: App, options?: VueDistributedPluginOptions) {
    Context.app = app;
    Context.logLevel = options?.logLevel || 'verbose';
    Context.provide(options?.provide);

    // Make context available anywhere.
    app.provide(ContextInjectionKey, Context);

    // Install library components.
    app.component('PluginLoader', PluginLoader);
    app.component('TryComponent', TryComponent);
  },
};

export { plugin as VueDistributed };

export { useRemoteImport };
export * from './types';
