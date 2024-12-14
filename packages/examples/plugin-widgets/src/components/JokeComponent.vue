<script setup lang="ts">
import { onBeforeMount, ref } from 'vue';
import InternalCard from './internals/InternalCard.vue';

const { bypass = ['sexist', 'racist', 'nsfw', 'explicit'] } = defineProps<{
  bypass: string[];
}>();

const emit = defineEmits(['loading']);

const joke = ref('');

const parseJoke = (res: Record<string, any>) => {
  if (res.joke) {
    return res.joke;
  } else if (res.setup && res.delivery) {
    return `${res.setup}\r\n${res.delivery}`;
  }
};

const fetchJoke = async () => {
  emit('loading', true);

  const num = Math.floor(Math.random() * (300 - 0 + 1)) + 0;

  const res = await fetch(`https://v2.jokeapi.dev/joke/Any?idRange=${num}`);
  const obj = await res.json();

  // console.log('JOKE', obj);

  if (obj.flags) {
    for (const flag of bypass) {
      if (obj.flags[flag]) return await fetchJoke();
    }
  }

  // Wait to show loader in example App.
  const timeout = setTimeout(() => {
    joke.value = parseJoke(obj);
    emit('loading', false);
    clearTimeout(timeout);
  }, 500);
};

onBeforeMount(async () => {
  await fetchJoke();
});

defineExpose({ fetchJoke });
</script>

<template lang="pug">
internal-card 
  template(v-slot:header)
    div Fetch A Joke

  .joke-content
    // A slot to replace by a loader when fetching.
    slot 
      div(v-if="!joke") [NO JOKE TO SHOW]
      div(
        v-else,
        :innerText="joke"
      ) 

  template(v-slot:footer)
    slot(name="footer")
      div Footer
</template>

<style lang="sass" scoped>
.joke-content
  width: 100%
  display: flex
  flex-grow: 1
  align-items: center
  justify-content: center
</style>
