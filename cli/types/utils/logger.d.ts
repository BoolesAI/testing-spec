export type LogLevel = 'debug' | 'info' | 'success' | 'warn' | 'error';
export interface LoggerOptions {
    verbose?: boolean;
    quiet?: boolean;
}
export declare function setLoggerOptions(options: LoggerOptions): void;
export declare function debug(message: string, ...args: unknown[]): void;
export declare function info(message: string, ...args: unknown[]): void;
export declare function success(message: string, ...args: unknown[]): void;
export declare function warn(message: string, ...args: unknown[]): void;
export declare function error(message: string, ...args: unknown[]): void;
export declare function log(message: string, ...args: unknown[]): void;
export declare function newline(): void;
export declare const logger: {
    debug: typeof debug;
    info: typeof info;
    success: typeof success;
    warn: typeof warn;
    error: typeof error;
    log: typeof log;
    newline: typeof newline;
    setOptions: typeof setLoggerOptions;
};
