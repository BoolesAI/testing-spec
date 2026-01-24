import { Command } from 'commander';
import type { OutputFormat } from '../utils/formatter.js';
export interface ParseParams {
    files: string[];
    output?: OutputFormat;
    verbose?: boolean;
    env?: Record<string, string>;
    params?: Record<string, string>;
}
export interface ParseExecutionResult {
    success: boolean;
    output: string;
    data: {
        testCases: unknown[];
        parseErrors: Array<{
            file: string;
            error: string;
        }>;
        summary: {
            totalFiles: number;
            totalTestCases: number;
            parseErrors: number;
        };
    };
}
/**
 * Parse test cases - core logic extracted for MCP integration
 */
export declare function executeParse(params: ParseParams): Promise<ParseExecutionResult>;
export declare const parseCommand: Command;
