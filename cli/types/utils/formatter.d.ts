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
    assertions: Array<{
        passed: boolean;
        type: string;
        message: string;
    }>;
}
export declare function formatTestResult(result: FormattedTestResult, verbose?: boolean): string;
export declare function formatTestSummary(summary: TestResultSummary): string;
export declare function formatTestResults(results: FormattedTestResult[], summary: TestResultSummary, options?: FormatOptions): string;
export declare function formatProtocolList(protocols: string[], options?: FormatOptions): string;
export declare function formatParsedTestCase(testCase: unknown, options?: FormatOptions): string;
