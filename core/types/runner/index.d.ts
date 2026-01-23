import type { TestCase } from '../parser/index.js';
import type { ProtocolType } from '../parser/types.js';
import type { TestRunner, TestResult, RunnerOptions } from './types.js';
export declare function createRunner(protocol: ProtocolType | null, options?: RunnerOptions): TestRunner;
export declare function executeTestCase(testCase: TestCase, options?: RunnerOptions): Promise<TestResult>;
export { HttpRunner } from './http/index.js';
export { registry, ExecutorRegistry, type ExecutorType } from './registry.js';
export type { TestRunner, TestResult, RunnerOptions, HttpRunnerOptions } from './types.js';
