<script lang="ts">
export default {
  name: 'PluginLoader',
};
</script>

<script setup async lang="ts">
import type { Plugin } from 'vue';
import { inject } from 'vue';
import { ContextInjectionKey } from '@/core/types';
import { AbstractContext } from '../internal/context.abstract';

const { url, type = 'umd' } = defineProps<{
  url: string;
  type: 'umd' | 'zip';
}>();

try {
  const context: AbstractContext | undefined = inject(ContextInjectionKey);
  if (!context) {
    console.error(
      new Error(`VueDistributed plugin may not have been installed properly.`)
    );
  } else {
    // Get the plugin at given URL.
    const plugin: Plugin = await context.pluginByURL(url, type);

    // Use it: will warn if already installed, depending on internal logger level.
    context.app.use(plugin);

    // Make sure to tear-down ALL the imported scripts before quitting.
    context.app.onUnmount(() => context.dispose());
  }
} catch (err: unknown) {
  console.error(err);
}
</script>

<template lang="pug">
slot
</template>
