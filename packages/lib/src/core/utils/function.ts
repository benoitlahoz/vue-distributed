import type { Plugin, App } from 'vue';

export const NoOp = (..._args: any[]): void => {};

// A returned 'install' function that installs nothing, in case of error.
export const NoOpPlugin: Plugin = { install: (_app: App) => {} };
