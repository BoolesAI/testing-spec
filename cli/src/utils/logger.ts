import chalk from 'chalk';

export type LogLevel = 'debug' | 'info' | 'success' | 'warn' | 'error';

export interface LoggerOptions {
  verbose?: boolean;
  quiet?: boolean;
}

let globalOptions: LoggerOptions = {};

export function setLoggerOptions(options: LoggerOptions): void {
  globalOptions = { ...globalOptions, ...options };
}

export function debug(message: string, ...args: unknown[]): void {
  if (globalOptions.verbose && !globalOptions.quiet) {
    console.error(chalk.gray(`[debug] ${message}`), ...args);
  }
}

export function info(message: string, ...args: unknown[]): void {
  if (!globalOptions.quiet) {
    console.error(chalk.blue(message), ...args);
  }
}

export function success(message: string, ...args: unknown[]): void {
  if (!globalOptions.quiet) {
    console.error(chalk.green(message), ...args);
  }
}

export function warn(message: string, ...args: unknown[]): void {
  console.warn(chalk.yellow(`[warn] ${message}`), ...args);
}

export function error(message: string, ...args: unknown[]): void {
  console.error(chalk.red(`[error] ${message}`), ...args);
}

export function log(message: string, ...args: unknown[]): void {
  console.error(message, ...args);
}

export function newline(): void {
  if (!globalOptions.quiet) {
    console.error();
  }
}

export const logger = {
  debug,
  info,
  success,
  warn,
  error,
  log,
  newline,
  setOptions: setLoggerOptions
};
