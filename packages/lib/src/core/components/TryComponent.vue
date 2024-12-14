<script lang="ts">
export default {
  name: 'TryComponent',
};
</script>

<script setup async lang="ts">
import type { Ref } from 'vue';
import { ref, watch, useAttrs } from 'vue';
import { useRemoteImport } from '@/core/composables';

const { is, error } = defineProps<{ is: string; error?: string }>();

const { isComponentRegistered, registeredPlugins } = useRemoteImport();

// The wrapped component.
const wrapped: Ref<string | undefined> = ref();

const attrs = useAttrs();

watch(
  () => registeredPlugins.value,
  () => {
    try {
      if (isComponentRegistered(is)) {
        wrapped.value = is;
      } else {
        // Component is not registered yet.
        if (error) {
          wrapped.value = error;
          return;
        }
        wrapped.value = undefined;
      }
    } catch (err: unknown) {
      // An error occurred.
      if (error) {
        wrapped.value = error;
        return;
      }
      wrapped.value = undefined;
    }
  },
  { immediate: true, deep: true }
);
</script>

<template lang="pug">
component(
    v-if="wrapped",
    :is="wrapped",
    v-bind="attrs"
)
</template>
