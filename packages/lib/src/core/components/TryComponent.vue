<script lang="ts">
export default {
  name: 'TryComponent',
};
</script>

<script setup async lang="ts">
import type { Ref } from 'vue';
import { ref, watch, useAttrs, inject } from 'vue';
import { AbstractContext } from '../internal/context.abstract';
import { ContextInjectionKey } from '../types';

const { is, error } = defineProps<{ is: string; error?: string }>();

// The wrapped component.
const wrapped: Ref<string | undefined> = ref();

const attrs = useAttrs();

try {
  const context: AbstractContext | undefined = inject(ContextInjectionKey);
  if (!context) {
    console.error(
      new Error(`VueDistributed plugin may not have been installed properly.`)
    );
  } else {
    watch(
      () => context.modules.value,
      () => {
        try {
          if (context.hasComponent(is)) {
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
  }
} catch (err: unknown) {
  console.error(err);
}
</script>

<template lang="pug">
component(
    v-if="wrapped",
    :is="wrapped",
    v-bind="attrs"
)
</template>
