import type { TestCase } from '../parser/index.js';
import type { ScheduleOptions, ScheduleResult } from './types.js';
export declare class TestScheduler {
    private defaultConcurrency;
    private defaultConcurrencyPerType;
    schedule(testCases: TestCase[], options?: ScheduleOptions): Promise<ScheduleResult>;
    scheduleByType(testCases: TestCase[], options?: ScheduleOptions): Promise<ScheduleResult>;
    private groupByType;
    private executeWithConcurrency;
    private createErrorResult;
    private buildResult;
}
export declare const scheduler: TestScheduler;
export type { ScheduleOptions, ScheduleResult, TypeGroupedCases } from './types.js';
