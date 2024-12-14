/**
 * A key injected on plugin build via the vite plugin.
 * The exported object will expose the 'vue-distributed' package version
 * the plugin was built with, a hash for this 'vue-distributed' version and a hash for
 * the user's library.
 */
export const VueDistributedModuleVersionKey =
  '___$_vue_distributed_build_info_$___';

export interface VueDistributedBuild {
  version: string;
  author: string | Record<string, any>;
  // Unique hash of this library, injected by our internal vite build plugin.
  loader: string;
  // Hash of the plugin injected at user's library build time by our public vite plugin.
  pkg: string;
}
