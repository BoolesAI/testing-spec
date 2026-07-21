import type { ValidationResult } from '@boolesai/tspec';
export type OutputFormat = 'json' | 'text' | 'table';
export interface FormatOptions {
    format?: OutputFormat;
    verbose?: boolean;
    quiet?: boolean;
}
export declare function formatJson(data: unknown): string;
export declare function formatValidationResult(result: ValidationResult, filePath: string): string;
export declare function formatValidationResults(results: Array<{
    file: string;
    result: ValidationResult;
}>, options?: FormatOptions): string;
export interface TestResultSummary {
    total: number;
    passed: number;
    failed: number;
    passRate: number;
    duration: number;
}
export interface FormattedTestResult {
    testCaseId: string;
    passed: boolean;
    duration: number;
    extracted?: Record<string, unknown>;
    assertions: Array<{
        passed: boolean;
        type: string;
        message: string;
        expression?: string;
        operator?: string;
        expected?: unknown;
        actual?: unknown;
        path?: string;
    }>;
    request?: {
        method: string;
        url: string;
        headers?: Record<string, string>;
        body?: unknown;
    };
    response?: {
        status?: number;
        headers?: Record<string, string | string[]>;
        body?: unknown;
        responseTime?: number;
    };
}
export declare function formatTestResult(result: FormattedTestResult, verbose?: boolean): string;
export declare function formatTestSummary(summary: TestResultSummary): string;
export declare function formatTestResults(results: FormattedTestResult[], summary: TestResultSummary, options?: FormatOptions): string;
export declare function formatProtocolList(protocols: string[], options?: FormatOptions): string;
export declare function formatParsedTestCase(testCase: unknown, options?: FormatOptions): string;
