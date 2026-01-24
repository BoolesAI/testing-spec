import { Command } from 'commander';
import type { OutputFormat } from '../utils/formatter.js';
export interface ValidateParams {
    files: string[];
    output?: OutputFormat;
}
export interface ValidateExecutionResult {
    success: boolean;
    output: string;
    data: {
        results: Array<{
            file: string;
            valid: boolean;
            errors: string[];
        }>;
    };
}
/**
 * Validate test cases - core logic extracted for MCP integration
 */
export declare function executeValidate(params: ValidateParams): Promise<ValidateExecutionResult>;
export declare const validateCommand: Command;
