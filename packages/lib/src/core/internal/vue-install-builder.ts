import type { App, Plugin } from 'vue';
import { inject } from 'vue';
import { ContextInjectionKey } from '@/core/types';
import { AbstractContext } from './context.abstract';
import { RegisteredModule } from './registered-module';

class _VueInstallBuilder {
  /**
   * A `Set` of hash string corresponding to the installed plugins.
   */
  private _installed: Set<string> = new Set();

  /**
   * Build a Vue `Plugin` with a registered module.
   *
   * @param { RegisteredModule } module The registered module.
   * @returns { Plugin } A Vue `Plugin`.
   */
  public build(module: RegisteredModule): Plugin {
    return {
      install: (app: App) => {
        const context: AbstractContext | undefined =
          inject(ContextInjectionKey);

        if (!context) {
          throw new Error(
            `Context was not injected. 'VueDistributed' may not be installed properly in Vue app.`
          );
        }

        context.info(`Installing plugin from url ${module.path}.`);

        // TODO: dynamic directives
        // see https://v2.vuejs.org/v2/guide/custom-directive.html#Dynamic-Directive-Arguments
        // We should wrap all directive in one of ours, that takes the final directive name as parameter
        // and check if present.
        for (const directive of module.directives || []) {
          app.directive(directive.name, directive.export);
        }

        const hash = btoa(module.sri);

        if (this._installed.has(hash)) {
          context.warn(
            `Plugin loaded with id '${module.sri}' is already installed.`
          );
          return;
        }

        for (const component of module.components) {
          app.component(component.name, component.export);
        }

        // Cache the plugin's hash, to avoid multiple installations.
        this._installed.add(hash);
      },
    };
  }

  /**
   * A 'Vue' plugin 'install' function that does nothing.
   */
  public NoOp: Plugin = { install: (_app: App) => {} };
}

const builder = new _VueInstallBuilder();
Object.seal(builder);

export { builder as VueInstallBuilder };
