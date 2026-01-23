import type { TestCase } from '../parser/index.js';
import type { Response } from '../assertion/types.js';
import type { ProtocolType } from '../parser/types.js';
import { runAssertions, extractVariables, getAssertionSummary } from '../assertion/index.js';
import type { TestRunner, TestResult, RunnerOptions, HttpRunnerOptions } from './types.js';
import { HttpRunner } from './http/index.js';
import { registry, ExecutorRegistry, type ExecutorType } from './registry.js';

// Register built-in executors
registry.register('http', HttpRunner);

export function createRunner(protocol: ProtocolType | null, options: RunnerOptions = {}): TestRunner {
  if (!protocol) {
    throw new Error('Protocol is required');
  }
  
  if (!registry.has(protocol as ExecutorType)) {
    throw new Error(`No executor registered for protocol: ${protocol}`);
  }
  
  return registry.create(protocol as ExecutorType, options);
}

export async function executeTestCase(testCase: TestCase, options: RunnerOptions = {}): Promise<TestResult> {
  const runner = createRunner(testCase.protocol, options);
  const startTime = Date.now();
  
  const response = await runner.execute(testCase);
  const duration = Date.now() - startTime;
  
  const assertionResults = runAssertions(response, testCase.assertions);
  const extracted = testCase.extract ? extractVariables(response, testCase.extract) : {};
  const summary = getAssertionSummary(assertionResults);
  const passed = assertionResults.every(r => r.passed);
  
  return {
    testCaseId: testCase.id,
    passed,
    assertions: assertionResults,
    summary,
    extracted,
    response,
    duration
  };
}

// Re-exports
export { HttpRunner } from './http/index.js';
export { registry, ExecutorRegistry, type ExecutorType } from './registry.js';
export type { TestRunner, TestResult, RunnerOptions, HttpRunnerOptions } from './types.js';
