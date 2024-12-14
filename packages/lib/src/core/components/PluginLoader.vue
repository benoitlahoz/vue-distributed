<script lang="ts">
export default {
  name: 'PluginLoader',
};
</script>

<script setup async lang="ts">
import type { App, Plugin } from 'vue';
import { inject } from 'vue';
import { VueAppInjectionKey } from '@/core/types';
import { useRemoteImport } from '@/core/composables';

const { url } = defineProps<{ url: string }>();
const { getPlugin, cleanImports, logger } = useRemoteImport();

try {
  const app: App | undefined = inject(VueAppInjectionKey);
  if (!app) {
    logger.error(
      new Error(`VueDistributed plugin may not have been installed properly.`)
    );
  } else {
    // Get the plugin at given URL.
    const plugin: Plugin = await getPlugin(url);

    // Use it: will warn if already installed, depending on internal logger level.
    app.use(plugin);

    // Make sure to tear-down ALL the imported scripts before quitting.
    app.onUnmount(() => cleanImports());
  }
} catch (err: unknown) {
  logger.error(err);
}
</script>

<template lang="pug">
slot
</template>
