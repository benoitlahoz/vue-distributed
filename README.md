# vue-distributed

An opinonated - though extensible - library to build and import Vue 3 plugins from remote server.

Warning: this is still a work in progress, please see `packages/examples/plugin-widgets` for an example on how to build a plugin and `packages/examples/app-serve` on how to load it.

## Install

```sh
npm install vue-distributed
```

```sh
yarn add vue-distributed
```

## Usage

TODO

### Create plugin

TODO

#### Dependencies

A plugin can bundle all dependencies it needs to consume, but this is strongly discouraged, unless the plugin is aimed to provide a global context for a dependency.
Instead, use Vue 3 provide / inject and describe the dependencies in the plugin entry point.

#### Vite configuration

`vue-distributed` exports a `definePluginConfig` function that wraps usual vite's `defineConfig` by adding specific configuration. 

### Load & consume plugin

TODO