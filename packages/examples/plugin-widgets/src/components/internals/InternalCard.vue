<script lang="ts">
export default {
  name: 'InternalCard',
};
</script>

<script setup lang="ts"></script>

<template lang="pug">
.plugin-card-container
    .header
        h1
            slot(name="header") Header 
    .content 
        slot Content 
    .footer
        slot(name="footer") Footer
</template>

<style lang="sass" scoped>
.plugin-card-container
    display: flex
    flex-direction: column
    min-width: 300px
    max-width: 300px
    background: rgb(14, 14, 17)

    .header
        display: flex
        align-items: center
        justify-content: space-between
        width: 100%
        border-bottom: 1px white solid

    .content
        flex-grow: 1
        overflow: scroll

    .footer
        display: flex
        align-items: center
        justify-content: space-between
        width: 100%
        padding-top: 1rem
        border-top: 1px white solid
</style>
