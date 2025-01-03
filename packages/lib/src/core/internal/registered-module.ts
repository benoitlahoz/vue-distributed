import type {
  ComponentDefinition,
  RegisteredModuleDefinition,
  ModuleDefinition,
  DirectiveDefinition,
} from '@/core/types';
import { Formatter } from './formatter';
import { intersects } from '@/core/utils';
import { Context } from './context';

export class RegisteredModule {
  public static of(path: string, sri: string, definition: ModuleDefinition) {
    return new RegisteredModule(path, sri, definition);
  }

  private _definition: RegisteredModuleDefinition;

  private constructor(
    private _path: string,
    public readonly sri: string,
    module: ModuleDefinition
  ) {
    this._definition = this.parseModule(module);
  }

  /**
   * Definition of the module.
   */
  public get definition(): RegisteredModuleDefinition {
    return this._definition;
  }

  /**
   * Path of the module (e.g. URL).
   */
  public get path(): string {
    return this._definition.path;
  }

  /**
   * Components of the module.
   */
  public get components(): ComponentDefinition[] {
    return this._definition.components;
  }

  /**
   * Directives of the module.
   */
  public get directives(): DirectiveDefinition[] {
    return this._definition.directives || [];
  }

  /**
   * Parse the definition exported by the module to conform to `ImportedModuleDefinition` that is more strict.
   *
   * @param { ModuleDefinition } module The definition exported by the module.
   * @returns { RegisteredModuleDefinition } The parsed definition.
   */
  private parseModule(module: ModuleDefinition) {
    const components: ComponentDefinition[] = [];
    for (const component of module.components || []) {
      try {
        // Try to convert from 'Component' to 'ComponentDefinition'...

        const converted = Formatter.formatComponent(component);
        if (converted) {
          components.push(converted);
        } else {
          Context.warn(
            `An object passed as component in loaded module is neither a Vue 'Component' nor a 'ComponentDefinition'.`
          );

          continue;
        }
      } catch (err: unknown) {
        // ... but won't throw in case object is not conform, to allow other objects to be loaded.

        const message =
          err && (err as any).message ? (err as any).message : undefined;

        Context.warn(message || `An unexpected error occurred.`);

        continue;
      }
    }

    const names = components.map(
      (component: ComponentDefinition) => component.name
    );
    const overlappoing = intersects(names, Context.componentsNames);

    if (overlappoing.length > 0) {
      Context.warn(
        `Components '${overlappoing.join(
          ', '
        )}' were already registered. The new implementations will replace existing ones.`
      );
    }

    const description = Formatter.formatDescription(module.description || {});
    const definition: RegisteredModuleDefinition = {
      path: this._path,
      sri: this.sri,
      loaded: Date.now(),
      ...module,
      description,
      components,
    };

    // Secure the definition.
    Object.freeze(definition);

    return definition;
  }
}
