import { NoOp } from '@/core/utils';

export enum LogLevel {
  'verbose' = 8,
  'info' = 16,
  'warning' = 32,
  'error' = 48,
  'off' = 1024,
}

export interface Logger {
  log(...args: any[]): void;
  info(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
}

// https://stackoverflow.com/a/41407246/1060921
const LoggerColors = {
  info: '\x1b[36m%s\x1b[0m',
  warn: '\x1b[33m%s\x1b[0m',
  error: '\x1b[31m%s\x1b[0m',
};

export const createLogger = (
  level: keyof typeof LogLevel = 'verbose',
  prefix: string = '[vue-distributed]'
): Logger => {
  prefix = prefix || '';

  switch (level) {
    case 'verbose':
      return loggerFactory(log, info, warn, error, prefix);

    case 'info':
      return loggerFactory(NoOp, info, warn, error, prefix);

    case 'warning':
      return loggerFactory(NoOp, NoOp, warn, error, prefix);

    case 'error':
      return loggerFactory(NoOp, NoOp, NoOp, error, prefix);

    default:
      return loggerFactory(NoOp, NoOp, NoOp, NoOp, prefix);
  }
};

const loggerFactory = (
  log: Function,
  info: Function,
  warn: Function,
  error: Function,
  prefix: string
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
  console.log(LoggerColors.info, prefix, ...args);
};

const warn = (prefix: string, ...args: any[]) => {
  console.warn(LoggerColors.warn, prefix, ...args);
};

const error = (prefix: string, ...args: any[]) => {
  console.error(LoggerColors.error, prefix, ...args);
};
