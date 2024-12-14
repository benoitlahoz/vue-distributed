<script setup lang="ts">
import { ref } from 'vue';
import { useRemoteImport } from 'vue-distributed';

const { getComponentsNames } = useRemoteImport();

const jokePlugin = ref();
const jokeLoading = ref(false);

const onJokeLoading = (loading: boolean) => {
  jokeLoading.value = loading;
};
</script>

<template lang="pug">
.example-container

  .example-widgets
    weather-component(message="Message from 'App'").widget

    joke-component(
      ref="jokePlugin",
      @loading="onJokeLoading"
    ).widget.joke.relative
      // Import a registered component in the slot.
      // Here it could be loader-component(...) as the component has been registered in main.ts
      component(is="LoaderComponent", v-if="jokeLoading").loader-component
      template(v-slot:footer)
        .joke-footer
          button(
            @click="async () => await jokePlugin.fetchJoke()"
          ) Fetch 

  .registered {{ `${getComponentsNames().length} component(s) registered: ${getComponentsNames().join(', ')}` }}
  .logo-container   
    img(
      src="/vite.svg"
    ).logo.vite 
    img(
      src="/vue.svg"
    ).logo.vue 
</template>

<style lang="sass">
:root
  color: white
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif
  line-height: 1.5
  font-weight: 400
  font-size: 16px
  font-synthesis: none
  text-rendering: optimizeLegibility
  -webkit-font-smoothing: antialiased
  -moz-osx-font-smoothing: grayscale
  -webkit-text-size-adjust: 100%

html,
body,
#app
  min-width: 100%
  min-height: 100%
  display: flex
  flex-wrap: wrap
  align-items: center
  justify-content: center
  background: rgb(14, 14, 14)
  margin: 0
  padding: 0

#app
  background: rgb(14, 14, 14)

.example-container
  display: flex
  flex-direction: column
  justify-content: center
  align-items: center

  .example-widgets
    display: flex
    flex-wrap: wrap

    .widget
      height: 350px
      max-height: 350px
      min-height: 350px
      width: 300px
      max-width: 300px
      min-width: 300px
      margin: 1rem

.logo-container
  display: flex
  width: 100%
  justify-content: space-around
  .logo
    height: 3rem
    width: 3rem
    padding: 2rem 0

// Here we can stylize the plugin.
.plugin-card-container
  padding: 1rem 2rem
  border-radius: 0.5rem
  border: 1px solid white

.relative
  position: relative
  .loader-component
    display: block
    position: absolute
    top: 175px
    left: 150px
    z-index: 1

.joke-content
  padding: 2rem 0

.joke-footer
  width: 100%
  display: flex
  justify-content: center

  button
    cursor: pointer
    background: rgb(14, 14, 14)
    color: white
    border: 1px solid white
    font-size: 1rem
    padding: 0.7rem
    width: 7rem
    border-radius: 900px

.registered
  display: flex
  width: 100%
  max-width: 100%
  justify-content: center
  font-size: 0.9em
  padding-top: 0.5rem
</style>
