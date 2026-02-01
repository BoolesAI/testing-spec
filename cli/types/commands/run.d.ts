import { Command } from 'commander';
import { type FormattedTestResult, type TestResultSummary } from '../utils/formatter.js';
import type { OutputFormat } from '../utils/formatter.js';
export interface RunParams {
    files: string[];
    output?: OutputFormat;
    concurrency?: number;
    verbose?: boolean;
    quiet?: boolean;
    failFast?: boolean;
    config?: string;
    env?: Record<string, string>;
    params?: Record<string, string>;
}
export interface RunExecutionResult {
    success: boolean;
    output: string;
    data: {
        results: FormattedTestResult[];
        summary: TestResultSummary;
        parseErrors: Array<{
            file: string;
            error: string;
        }>;
    };
}
/**
 * Execute test cases - core logic extracted for MCP integration
 */
export declare function executeRun(params: RunParams): Promise<RunExecutionResult>;
export declare const runCommand: Command;
