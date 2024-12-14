// https://stackoverflow.com/a/41407246/1060921
import { NoOp } from './function';

export enum VueDistributedLoggerLevel {
  'verbose' = 8,
  'info' = 16,
  'warning' = 32,
  'error' = 48,
  'off' = 1024,
}

export interface VueDistributedLogger {
  log(...args: any[]): void;
  info(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
}

export const createLogger = (
  level: keyof typeof VueDistributedLoggerLevel = 'verbose',
  prefix: string = '[vue-distributed]'
): VueDistributedLogger => {
  prefix = prefix || '';

  switch (level) {
    case 'verbose':
      return loggerFabric(prefix, log, info, warn, error);

    case 'info':
      return loggerFabric(prefix, NoOp, info, warn, error);

    case 'warning':
      return loggerFabric(prefix, NoOp, NoOp, warn, error);

    case 'error':
      return loggerFabric(prefix, NoOp, NoOp, NoOp, error);

    default:
      return loggerFabric(prefix, NoOp, NoOp, NoOp, NoOp);
  }
};

const loggerFabric = (
  prefix: string,
  log: Function,
  info: Function,
  warn: Function,
  error: Function
) => {
  return {
    log: (...args: any[]) => log.apply(null, [prefix, ...args]),
    info: (...args: any[]) => info.apply(null, [prefix, ...args]),
    warn: (...args: any[]) => warn.apply(null, [prefix, ...args]),
    error: (...args: any[]) => error.apply(null, [prefix, ...args]),
  };
};

const log = (prefix: string, ...args: any[]) => {
  console.log(prefix, ...args);
};

const info = (prefix: string, ...args: any[]) => {
  console.log('\x1b[36m%s\x1b[0m', prefix, ...args);
};

const warn = (prefix: string, ...args: any[]) => {
  console.warn('\x1b[33m%s\x1b[0m', prefix, ...args);
};

const error = (prefix: string, ...args: any[]) => {
  console.error('\x1b[31m%s\x1b[0m', prefix, ...args);
};
