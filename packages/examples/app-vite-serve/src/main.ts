import { createApp } from 'vue';
import App from './App.vue';
import { VueDistributed } from 'vue-distributed';

// Dependencies that could be used by the plugins.
import * as THREE from 'three';

const app = createApp(App);

app
  .use(VueDistributed, {
    logLevel: 'verbose',
    provide: {
      three: THREE,
    },
  })
  .mount('#app');
