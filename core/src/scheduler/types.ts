import type { TestResult, RunnerOptions } from '../runner/types.js';

export interface ScheduleOptions {
  concurrency?: number;           // Max concurrent executions overall (default: 5)
  concurrencyPerType?: number;    // Max concurrent executions per type (default: 3)
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
