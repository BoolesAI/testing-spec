import type { TestCase } from '../parser/index.js';
import type { Response } from '../assertion/types.js';
import type { ProtocolType } from '../parser/types.js';
import { runAssertions, getAssertionSummary } from '../assertion/index.js';
import type { TestRunner, TestResult, RunnerOptions, HttpRunnerOptions } from './types.js';
import { HttpRunner } from './http/index.js';
import { registry, ExecutorRegistry, type ExecutorType } from './registry.js';
import { executeLifecycleActions, createLifecycleContext } from '../lifecycle/index.js';

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
  
  // Initialize lifecycle context with test case variables
  const lifecycleContext = createLifecycleContext(testCase.variables || {});
  
  // Execute setup actions - test scope
  if (testCase.lifecycle?.setup) {
    await executeLifecycleActions(testCase.lifecycle.setup, 'test', lifecycleContext);
  }
  
  // Execute setup actions - run scope
  if (testCase.lifecycle?.setup) {
    await executeLifecycleActions(testCase.lifecycle.setup, 'run', lifecycleContext);
  }
  
  // Execute the test
  const response = await runner.execute(testCase);
  lifecycleContext.response = response;
  const duration = Date.now() - startTime;
  
  // Execute teardown actions - run scope
  if (testCase.lifecycle?.teardown) {
    await executeLifecycleActions(testCase.lifecycle.teardown, 'run', lifecycleContext);
  }
  
  // Execute teardown actions - assert scope (before assertions to allow extract)
  if (testCase.lifecycle?.teardown) {
    await executeLifecycleActions(testCase.lifecycle.teardown, 'assert', lifecycleContext);
  }
  
  // Run assertions
  const assertionResults = runAssertions(response, testCase.assertions);
  const summary = getAssertionSummary(assertionResults);
  const passed = assertionResults.every(r => r.passed);
  
  // Execute teardown actions - test scope
  if (testCase.lifecycle?.teardown) {
    await executeLifecycleActions(testCase.lifecycle.teardown, 'test', lifecycleContext);
  }
  
  return {
    testCaseId: testCase.id,
    passed,
    assertions: assertionResults,
    summary,
    extracted: lifecycleContext.extractedVars,
    response,
    duration
  };
}

// Re-exports
export { HttpRunner } from './http/index.js';
export { registry, ExecutorRegistry, type ExecutorType } from './registry.js';
export type { TestRunner, TestResult, RunnerOptions, HttpRunnerOptions } from './types.js';
