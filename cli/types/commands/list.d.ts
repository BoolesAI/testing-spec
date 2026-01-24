import { Command } from 'commander';
import type { OutputFormat } from '../utils/formatter.js';
export interface ListParams {
    output?: OutputFormat;
}
export interface ListExecutionResult {
    success: boolean;
    output: string;
    data: {
        protocols: string[];
    };
}
/**
 * List protocols - core logic extracted for MCP integration
 */
export declare function executeList(params: ListParams): Promise<ListExecutionResult>;
export declare const listCommand: Command;
