/**
 * An example of distributed vue plugin entry point.
 * Warning: do not import external dependencies here, unless you add the to the global window's scope.
 */

import type { VuePluginDefinition } from 'vue-distributed';
import {
  JokeComponent,
  WeatherComponent,
  LoaderComponent,
  ThreeComponent,
} from './components';

// Plugins can either export 'const plugin' or 'default'

const plugin: VuePluginDefinition = {
  name: 'MyPlugin',
  version: '1.0.0',
  description: {
    info: 'An example plugin exporting components...',
    authors: {
      name: 'Benoît Lahoz',
      email: 'info@benoitlahoz.io',
      url: 'www.benoitlahoz.io',
    },
  },
  // ThreeComponent depends on 'three'.
  dependencies: ['three'],

  components: [
    // Basic: pass the component directly.

    JokeComponent,
    ThreeComponent,

    // Minimal VuePluginComponent definition.

    {
      name: 'LoaderComponent',
      export: LoaderComponent,

      // Optional: can be string or object, (see below).

      description: 'A CSS loader.',
    },

    // VuePluginComponent: all Vue 'Component' passed here will be converted to this format + props and emits.

    {
      name: 'WeatherComponent',
      description: {
        info: `A widget that fetches weather.`,
        authors: [
          {
            name: 'Benoît Lahoz',
            email: 'info@benoitlahoz.io',
            url: 'www.benoitlahoz.io',
          },
        ],
        contributors: [
          {
            name: 'John Doe',
            email: 'john@doe.com',
            url: 'www.johndoe.com',
          },
        ],
      },
      export: WeatherComponent,
    },

    // Invalid object will be bypassed with warning.

    {},
  ],
};

// Plugins can either export 'const plugin' or 'default'

export { plugin as default };
