/**
 * An example of distributed vue plugin entry point.
 * Warning: do not import external dependencies here, unless you add the to the global window's scope.
 */

import PluginLoader from '../../../../core/components/PluginLoader.vue';
import type { ModuleDefinition } from 'vue-distributed';

const foo = 'bar';
export { foo };
// : ModuleDefinition
export const plugin = {
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

  dependencies: { three: '0.170.0' },

  components: [
    PluginLoader,

    // Minimal component definition.

    {
      name: 'LoaderComponent',
      export: null,

      // Optional: can be string or object, (see below).

      description: 'A CSS loader.',
    },

    // ComponentDefinition: all Vue 'Component' passed here will be converted to this format + props and emits.

    {
      name: 'WeatherComponent',
      description: {
        info: `A widget that fetches weather.`, // FIXME: avec un template literal `` le reduceProperty ne marche pas.
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
      export: null,
    },

    // Invalid object will be bypassed with warning.

    {},
  ],
};

// Plugins can either export 'const plugin' or 'default'

export { plugin as default };
/*
export default {
  // foo: foo,
  foo,
};
*/
