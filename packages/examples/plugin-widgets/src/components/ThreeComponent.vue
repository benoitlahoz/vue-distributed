<script setup async lang="ts">
import type { Ref } from 'vue';
import { inject, nextTick, ref, watch } from 'vue';
import * as THREE from 'three';
import InternalCard from './internals/InternalCard.vue';

const three: typeof THREE | undefined = inject('three');
const threeContent: Ref<HTMLElement | undefined> = ref();

watch(
  () => threeContent.value,
  () => {
    if (three && threeContent.value) {
      const el = threeContent.value;

      nextTick(() => {
        const width = el.offsetWidth;
        const height = el.offsetHeight;

        const camera = new three.PerspectiveCamera(
          70,
          width / height,
          0.01,
          10
        );
        camera.position.z = 1;

        const scene = new three.Scene();

        const geometry = new three.BoxGeometry(0.2, 0.2, 0.2);
        const material = new three.MeshNormalMaterial();

        const mesh = new three.Mesh(geometry, material);
        scene.add(mesh);

        const renderer = new three.WebGLRenderer({
          antialias: true,
          alpha: true,
        });
        renderer.setSize(width, height);
        renderer.setAnimationLoop(animate);
        el.appendChild(renderer.domElement);

        // animation

        function animate(time: number) {
          mesh.rotation.x = time / 2000;
          mesh.rotation.y = time / 1000;

          renderer.render(scene, camera);
        }
      });
    }
  },
  { immediate: true }
);
</script>

<template lang="pug">
internal-card 
  template(v-slot:header)
    div Three

  .three-content(
    ref="threeContent"
  )

  template(v-slot:footer)
    slot(name="footer")
      div 'three' dependency was injected by container app.
</template>

<style lang="sass" scoped>
.three-content
  width: 100%
  height: 100%
  display: flex
  align-items: center
  justify-content: center
</style>
