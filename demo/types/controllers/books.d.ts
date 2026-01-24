import type { Context } from 'koa';
export declare function listBooks(ctx: Context): Promise<void>;
export declare function getBook(ctx: Context): Promise<void>;
export declare function createBook(ctx: Context): Promise<void>;
export declare function updateBook(ctx: Context): Promise<void>;
export declare function deleteBook(ctx: Context): Promise<void>;
