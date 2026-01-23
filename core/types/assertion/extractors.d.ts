import type { Response } from './types.js';
export declare function extractJsonPath(data: unknown, expression: string): unknown;
export declare function extractByPath(data: unknown, pathStr: string): unknown;
export declare function extractVariables(response: Response, extractConfig: Record<string, string>): Record<string, unknown>;
