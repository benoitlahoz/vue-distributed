import * as Vue from 'vue';
import type { App, Plugin, Ref } from 'vue';
import { ref, unref } from 'vue';
import type { ScriptId, ComponentDefinition } from '@/core/types';
import type { Logger, LogLevel } from './logger';
import { createLogger } from './logger';
import { URLModuleImporter, ZipModuleImporter } from './importers';
import { VueInstallBuilder } from './vue-install-builder';
import { RegisteredModule } from './registered-module';
import { Formatter } from './formatter';
import { AbstractContext } from './context.abstract';

const LoggerPrefix = '[vue-distributed]';

class _Context implements AbstractContext {
  /**
   * 'Vue' app.
   */
  private _app: App | undefined;

  /**
   * Logger (defaults to 'verbose' log level).
   */
  private _logger: Logger = createLogger('verbose', LoggerPrefix);

  /**
   * Cached injected scripts ids in order.
   */
  private _scriptsIds: ScriptId[] = [];

  /**
   * Plugins definitions.
   */
  private _modules: Ref<RegisteredModule[]> = ref([]);

  /**
   * Dependencies that are provided by 'app'.
   */
  private _dependencies: Ref<Record<string, any>> = ref({});

  constructor() {
    // Add 'Vue' to the global scope.
    (window as any).Vue = Vue;
  }

  /**
   * The 'Vue' app.
   */
  public set app(app: App) {
    this._app = app;
  }

  /**
   * The `Vue` application this context is bound to.
   *
   * @throws { Error } An error if the app was not set.
   */
  public get app(): App {
    if (!this._app) {
      throw new Error(`'Vue' app was not set.`);
    }
    return this._app;
  }

  /**
   * A reactive list of registered modules.
   */
  public get modules(): Ref<RegisteredModule[]> {
    return this._modules;
  }

  /**
   * A reactive object that contains injected dependencies.
   */
  public get dependencies(): Ref<Record<string, any>> {
    return this._dependencies;
  }

  /**
   * The registered components.
   */
  public get components(): ComponentDefinition[] {
    return this.modules.value
      .map((module: RegisteredModule) => module.components)
      .flat();
  }

  /**
   * The registered components names.
   */
  public get componentsNames(): string[] {
    return this.modules.value
      .map((module: RegisteredModule) =>
        module.components.map(
          (component: ComponentDefinition) => component.name
        )
      )
      .flat(2);
  }

  /**
   * The log level used at this point.
   */
  public set logLevel(level: keyof typeof LogLevel) {
    this._logger = createLogger(level, LoggerPrefix);
  }

  public log(...args: any[]): this {
    this._logger.log(...args);
    return this;
  }

  public info(...args: any[]): this {
    this._logger.info(...args);
    return this;
  }

  public warn(...args: any[]): this {
    this._logger.warn(...args);
    return this;
  }

  public error(...args: any[]): this {
    this._logger.error(...args);
    return this;
  }

  /**
   * Provide dependencies that modules can `inject`.
   *
   * @param { Record<string, any> } injected An object of dependencies that can be injected by modules.
   * @returns { this } This context.
   *
   * @example
   * ```typescript
   * // At bootstrap.
   * import * as THREE from 'three';
   *
   * context.provide({ three: THREE });
   *
   * // In the plugin.
   * import { inject } from 'vue';
   *
   * const THREE = inject('three');
   * ```
   */
  public provide(injected: Record<string, any> = {}): this {
    const dependencies = unref(this._dependencies);

    for (const name in injected) {
      const value = injected[name];

      if (Object.values(dependencies).includes(value)) {
        // The same dependency was added with different name.

        this.error(
          `Dependency with name '${name}' was already added as '${Object.keys(
            dependencies
          ).find((key) => dependencies[key] === value)}'. Discarding.`
        );
        return this;
      }

      if (dependencies[name]) {
        // A dependency was added with same name.

        this.warn(
          `Dependency with name '${name}' was already added. Discarding.`
        );
        return this;
      }

      dependencies[name] = injected[name];
      this.app.provide(name, dependencies[name]);
    }

    return this;
  }

  public async pluginByURL(url: string, suffix = 'umd'): Promise<Plugin> {
    try {
      const clean = Formatter.cleanPath(url);
      const isZip = clean.endsWith('.zip') && suffix === 'zip';

      // TODO: decide of the format of the 'zip' file and stop relying on 'umd' suffix.
      // TODO: read the json to get all info.
      const name = Formatter.libraryNameFromUrl(url, 'umd'); // suffix);
      if (!name) {
        throw new Error(
          `Library name is not valid for url '${url}' with suffix '${suffix}'.`
        );
      }

      const existing = this._modules.value.find(
        (module: RegisteredModule) =>
          Formatter.libraryNameFromUrl(module.path, suffix) === name
      );

      if (existing) {
        this.warn(`A plugin was already loaded with url '${clean}'.`);

        // We don't know if the plugin has been installed ('use'd) by Vue, but it already has been imported:
        // return a 'Plugin' but don't add it to scripts/cache...

        return VueInstallBuilder.build(existing);
      } else {
        // Get SRI file associated built with module.

        const res = await fetch(`${url}.sri`);

        if (!res.ok) {
          const error = await res.text();
          // Error will be caught by this 'catch'.
          throw new Error(error);
        }

        const sri = await res.text();
        let module;
        if (isZip) {
          this._logger.info(`Importing zip library with name '${name}'.`)

          module = await ZipModuleImporter.import(
            clean,
            name,
            this._scriptsIds
          );
        } else {
          this._logger.info(`Importing umd library with name '${name}'.`)
          module = await URLModuleImporter.import(clean, sri, this._scriptsIds);
        }

        // Module must export its definition with a variable called 'plugin' or as 'default'.
        // TODO: Read the JSON to get exported function name.
        const imported = module ? module.plugin || module.default : undefined;

        if (imported) {
          // Register the module.

          const registered = RegisteredModule.of(clean, sri, imported);
          this._modules.value.push(registered);

          // Build an install function.

          return VueInstallBuilder.build(registered);
        } else {
          this.warn(
            `Library at path '${url}' doesn't export a value for 'plugin' or 'default'. Returning empty install function.`
          );
        }
      }
    } catch (err: unknown) {
      this.error(err);
      this.warn(`Module couldn't be imported from '${url}'.`);
    }

    return VueInstallBuilder.NoOp;
  }

  /**
   * Check if a `Component` is registered.
   *
   * @param { string } name The name of the component.
   * @returns { boolean } `true` if the component is registered.
   */
  public hasComponent(name: string): boolean {
    return this.componentsNames.includes(name);
  }

  /**
   * Clear all modules by removing their script element and
   * internal context state.
   *
   * @returns { this } This context.
   */
  public clear(): this {
    try {
      const dependencies = unref(this._dependencies);
      for (const key in dependencies) {
        delete dependencies[key];
      }

      const definitions = unref(this._modules);
      definitions.length = 0;

      const errors = [];
      for (const id of this._scriptsIds) {
        const script = document.getElementById(id);
        if (script) {
          script.remove();
        } else {
          errors.push(id);
        }
      }

      if (errors.length > 0) {
        this.error(`Scripts with ids ${errors.join(', ')} doesn't exist.`);
      }
    } catch (err: unknown) {
      throw err;
    }

    return this;
  }

  /**
   * Dispose this context.
   */
  public dispose(): void {
    this.clear();
  }
}

const context = new _Context();
Object.seal(context);

// Export singleton.
export { context as Context };
