import type { Component, Directive } from 'vue';
import { LogLevel } from '@/core/internal/logger';
// import { VueDistributedBuild } from '@/vite/build.private';

/**
 * Injection key used to provide / inject `Context`.
 */
export const ContextInjectionKey = Symbol('ContextInjectionKey');

/**
 * Helper type for nullable value.
 */
export type Nullable<T> = T | null;

/**
 * A type alias to 'string' for the 'id' of the injected `script` element.
 */
export type ScriptId = string;

/**
 * A type alias to 'string' for dependency name.
 */
export type DependencyName = string;

/**
 * A type alias to 'string' for dependency version.
 */
export type DependencyVersion = string;

export interface VersionCompareResult {
  plugin: string;
  library: string;
  state: string & ('equal' | 'older' | 'newer' | 'unknown');
}

/**
 * Author or contributor definition.
 *
 * @interface AuthorDescription
 *
 * @member { string | null } `name` The name of the author or contributor.
 * @member { string | null | undefined } `url` An url for the author or contributor.
 * @member { string | null | undefined } `email` Author's or contributor's email.
 */
export interface AuthorDescription {
  name: Nullable<string>;
  url?: Nullable<string>;
  email?: Nullable<string>;
}

export interface GenericDescription {
  info?: Nullable<string>;
  authors?: Nullable<string | AuthorDescription | AuthorDescription[]>;
  contributors?: Nullable<string | AuthorDescription[]>;
}

export interface ComponentProp {
  type?: string;
  default?: Nullable<string>;
  required?: boolean;
  validator?: boolean;
}

export const ComponentDefinitionMandatoryKeys = {
  name: 'string',
  export: 'object',
};

export interface ComponentDefinition {
  name: string;
  export: Component;

  description?: Nullable<string | GenericDescription>;
  props?: Nullable<Record<string, ComponentProp>>;
  emits?: Nullable<string[]>;
}

export interface DirectiveDefinition {
  name: string;
  description?: Nullable<string | GenericDescription>;
  export: Directive;
}

export interface ModuleDefinition {
  name: string;
  description?: Nullable<string | GenericDescription>;
  version?: Nullable<string>;
  category?: Nullable<string>;
  components?: (Component | ComponentDefinition)[];
  directives?: DirectiveDefinition[];
  dependencies?: Record<DependencyName, DependencyVersion>;

  // Will be set at runtime when registered.
  // __build?: never;
}

// TODO: inject a global 'PluginContext' that contains all properties the end user needs to define
// and encourage the plugins creators to have a prop on thei components to load this context and
// get it.
export interface RegisteredModuleDefinition
  extends Omit<ModuleDefinition, 'components' | '__build'> {
  path: string;
  loaded: number;
  components: (ComponentDefinition & ComponentProp)[];
  sri: string;

  // __build: VueDistributedBuild;
}

export interface VueDistributedPluginOptions {
  logLevel?: keyof typeof LogLevel;
  provide?: Record<string, any>;
}
