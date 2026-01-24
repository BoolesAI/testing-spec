import type { Context, Next } from 'koa';
export interface ApiError {
    error: string;
    message: string;
    details?: string[];
    timestamp: string;
}
export declare function errorHandler(): (ctx: Context, next: Next) => Promise<void>;
