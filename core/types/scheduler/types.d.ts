import type { TestResult, RunnerOptions } from '../runner/types.js';
export interface ScheduleOptions {
    concurrency?: number;
    concurrencyPerType?: number;
    runnerOptions?: RunnerOptions;
}
export interface ScheduleResult {
    results: TestResult[];
    duration: number;
    summary: {
        total: number;
        passed: number;
        failed: number;
        passRate: number;
    };
}
export interface TypeGroupedCases {
    [type: string]: import('../parser/index.js').TestCase[];
}
