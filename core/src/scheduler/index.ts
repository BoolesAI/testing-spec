import type { TestCase } from '../parser/index.js';
import type { TestResult, RunnerOptions } from '../runner/types.js';
import { executeTestCase } from '../runner/index.js';
import type { ScheduleOptions, ScheduleResult, TypeGroupedCases } from './types.js';

export class TestScheduler {
  private defaultConcurrency = 5;
  private defaultConcurrencyPerType = 3;

  async schedule(testCases: TestCase[], options: ScheduleOptions = {}): Promise<ScheduleResult> {
    const { concurrency = this.defaultConcurrency, runnerOptions = {} } = options;
    const startTime = Date.now();

    const results = await this.executeWithConcurrency(testCases, concurrency, runnerOptions);

    return this.buildResult(results, startTime);
  }

  async scheduleByType(testCases: TestCase[], options: ScheduleOptions = {}): Promise<ScheduleResult> {
    const { concurrencyPerType = this.defaultConcurrencyPerType, runnerOptions = {} } = options;
    const startTime = Date.now();

    // Group test cases by protocol type
    const grouped = this.groupByType(testCases);
    
    // Execute different types concurrently
    const typePromises = Object.entries(grouped).map(([_type, cases]) =>
      this.executeWithConcurrency(cases, concurrencyPerType, runnerOptions)
    );

    const typeResults = await Promise.all(typePromises);
    const results = typeResults.flat();

    return this.buildResult(results, startTime);
  }

  private groupByType(testCases: TestCase[]): TypeGroupedCases {
    return testCases.reduce((acc, testCase) => {
      const type = testCase.protocol || 'unknown';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(testCase);
      return acc;
    }, {} as TypeGroupedCases);
  }

  private async executeWithConcurrency(
    testCases: TestCase[],
    concurrency: number,
    runnerOptions: RunnerOptions
  ): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const queue = [...testCases];
    const executing: Promise<void>[] = [];

    const executeNext = async (): Promise<void> => {
      if (queue.length === 0) return;
      
      const testCase = queue.shift()!;
      try {
        const result = await executeTestCase(testCase, runnerOptions);
        results.push(result);
      } catch (error) {
        results.push(this.createErrorResult(testCase, error));
      }
    };

    // Start initial batch
    for (let i = 0; i < Math.min(concurrency, testCases.length); i++) {
      const promise = executeNext().then(() => {
        // Remove from executing and start next
        const index = executing.indexOf(promise);
        if (index > -1) {
          executing.splice(index, 1);
        }
        if (queue.length > 0) {
          const next = executeNext();
          executing.push(next);
          return next;
        }
      });
      executing.push(promise);
    }

    // Wait for all to complete
    while (executing.length > 0) {
      await Promise.race(executing);
    }

    return results;
  }

  private createErrorResult(testCase: TestCase, error: unknown): TestResult {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      testCaseId: testCase.id,
      passed: false,
      assertions: [{
        passed: false,
        type: 'execution_error',
        message: `Execution failed: ${errorMessage}`
      }],
      summary: {
        total: 1,
        passed: 0,
        failed: 1,
        passRate: 0
      },
      extracted: {},
      response: {
        statusCode: 0,
        body: null,
        headers: {},
        responseTime: 0
      },
      duration: 0
    };
  }

  private buildResult(results: TestResult[], startTime: number): ScheduleResult {
    const duration = Date.now() - startTime;
    const total = results.length;
    const passed = results.filter(r => r.passed).length;
    const failed = total - passed;

    return {
      results,
      duration,
      summary: {
        total,
        passed,
        failed,
        passRate: total > 0 ? (passed / total) * 100 : 0
      }
    };
  }
}

export const scheduler = new TestScheduler();

export type { ScheduleOptions, ScheduleResult, TypeGroupedCases } from './types.js';
