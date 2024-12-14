import type { Component, Directive } from 'vue';
import { VueDistributedBuild } from '@/vite/build.private';

/**
 * Injection key used to provide / inject 'Vue' app.
 */
export const VueAppInjectionKey = Symbol('VueAppInjectionKey');

/**
 * Helper type for nullable value.
 */
export type Nullable<T> = T | null;

export const VuePluginComponentMandatory = {
  name: 'string',
  export: 'object',
};

/**
 * Author or contributor definition.
 */
export interface VuePluginAuthor {
  /**
   * The name of the author or contributor.
   */
  name: Nullable<string>;
  /**
   * An url for the author or contributor.
   */
  url?: Nullable<string>;
  /**
   * Author's or contributor's email.
   */
  email?: Nullable<string>;
}

export interface VuePluginDescription {
  info?: Nullable<string>;
  authors?: Nullable<string | VuePluginAuthor | VuePluginAuthor[]>;
  contributors?: Nullable<string | VuePluginAuthor[]>;
}

export interface VuePluginComponentEmits {
  emits?: Nullable<string[]>;
}

export interface VuePluginComponentProp {
  type?: string;
  default?: Nullable<string>;
  required?: boolean;
  validator?: boolean;
}

export interface VuePluginComponentDescription extends VuePluginComponentEmits {
  info?: Nullable<string>;
  authors?: Nullable<string | VuePluginAuthor | VuePluginAuthor[]>;
  contributors?: Nullable<string | VuePluginAuthor[]>;
  props?: Nullable<Record<string, VuePluginComponentProp>>;
}

export interface VuePluginComponent {
  name: string;
  description?: Nullable<string | VuePluginDescription>;
  export: Component;
}

export interface VuePluginDirective {
  name: string;
  description?: Nullable<string | VuePluginDescription>;
  export: Directive;
}

export interface VuePluginDefinition {
  name: string;
  description?: Nullable<string | VuePluginDescription>;
  version?: Nullable<string>;
  category?: Nullable<string>;
  components?: (Component | VuePluginComponent)[];
  directives?: VuePluginDirective[];
  dependencies?: string[];

  // Will be set at runtime when registered.
  __build?: never;
}

// TODO: inject a global 'PluginContext' that contains all properties the end user needs to define
// and encourage the plugins creators to have a prop on thei components to load this context and
// get it.
export interface VuePluginRegistered
  extends Omit<VuePluginDefinition, 'components' | '__build'> {
  path: string;
  loaded: number;
  components: (VuePluginComponent &
    VuePluginComponentProp &
    VuePluginComponentEmits)[];

  __build: VueDistributedBuild;
}

export interface VuePluginVersionCompare {
  plugin: string;
  library: string;
  state: string & ('equal' | 'older' | 'newer' | 'unknown');
}
