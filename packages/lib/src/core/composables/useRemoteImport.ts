import type { Plugin } from 'vue';
import { Context } from '@/core/internal';
import type { LogLevel } from '@/core/internal/logger';

export const useRemoteImport = () => {
  /**
   * Get current version of 'vue-distributed' by reading the env.
   * If user chose to prefix its vite build with another prefix
   * it could break: untested.
   *
   * @returns { string } The version of the library or a default '0.0.0' version.
   *
   * @todo Test with another vite 'env' prefix.
   */
  const libVersion: string =
    import.meta.env.VITE_VUE_DISTRIBUTED_VERSION || '0.0.0';

  /**
   * Get the 'install' function built by 'Context' for the imported module.
   *
   * @param { string } url The URL from where we import the module.
   * @param { string | undefined } suffix The suffix used to parse the name of the module (defaults to 'umd').
   * @returns { { install: (app: App) => void } } The 'install' function, or a NoOp if nothing is exported by the plugin.
   */
  const getPlugin = async (url: string, suffix = 'umd'): Promise<Plugin> => {
    return Context.pluginByURL(url, suffix);
  };

  /**
   * Get the registered components names.
   *
   * @returns { string[] } The registered components names.
   */
  const getComponentsNames = () => Context.componentsNames;

  /**
   * Check if a `Component` is registered.
   *
   * @param { string } name The name of the component.
   * @returns { boolean } `true` if the component is registered.
   */
  const isComponentRegistered = Context.hasComponent;

  /*
  const compareVersion = (
    plugin: RegisteredModuleDefinition
  ): VersionCompareResult => {
    let ret: VersionCompareResult;

    try {
      const libVersion = getLibVersion();
      const pluginVersion = plugin.__build.version;

      const isPluginNewer = isNewerVersion(libVersion, pluginVersion);
      const isPluginOlder = isOlderVersion(libVersion, pluginVersion);

      if (isPluginNewer) {
        ret = {
          library: libVersion,
          plugin: pluginVersion,
          state: 'newer',
        };
      } else if (isPluginOlder) {
        ret = {
          library: libVersion,
          plugin: pluginVersion,
          state: 'older',
        };
      } else {
        ret = {
          library: libVersion,
          plugin: pluginVersion,
          state: 'equal',
        };
      }
    } catch (err: unknown) {
      Context.warn(`An unexpected error occurred when comparing versions.`);
      Context.error(err);

      ret = {
        library: '0.0.0',
        plugin: '0.0.0',
        state: 'unknown',
      };
    }

    return ret;
  };
  */
  return {
    libVersion,

    setLogLevel: (logLevel: keyof typeof LogLevel) =>
      (Context.logLevel = logLevel),

    getPlugin,
    getComponentsNames,

    isComponentRegistered,
    // compareVersion,
  };
};
