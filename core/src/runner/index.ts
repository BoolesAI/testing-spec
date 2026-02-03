import type { TestCase } from '../parser/index.js';
import type { Assertion } from '../parser/types.js';
import type { Response, AssertionResult } from '../assertion/types.js';
import type { ProtocolType } from '../parser/types.js';
import { runAssertions, getAssertionSummary } from '../assertion/index.js';
import type { TestRunner, TestResult, RunnerOptions, HttpRunnerOptions } from './types.js';
import { HttpRunner } from './http/index.js';
import { registry, ExecutorRegistry, type ExecutorType } from './registry.js';
import { executeLifecycleActions, createLifecycleContext } from '../lifecycle/index.js';

// Register built-in executors
registry.register('http', HttpRunner);

/**
 * Check if response indicates a network error (status 0 = connection failure)
 */
function isNetworkError(response: Response): boolean {
  const status = response.status ?? response.statusCode ?? response._envelope?.status;
  return status === 0;
}

/**
 * Check if test case has an exception assertion (expects network errors)
 */
function hasExceptionAssertion(assertions: Assertion[]): boolean {
  return assertions.some(a => a.type === 'exception');
}

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
  
  // Check for network errors - auto-fail unless test expects exception
  if (isNetworkError(response) && !hasExceptionAssertion(testCase.assertions)) {
    const errorBody = response.body as { error?: string; name?: string } | undefined;
    const networkErrorAssertion: AssertionResult = {
      passed: false,
      type: 'network_error',
      message: `Network error: ${errorBody?.error || 'Connection failed'}`,
      expected: 'Successful connection',
      actual: `status: 0 (${errorBody?.name || 'Error'})`
    };
    
    // Execute teardown actions - test scope
    if (testCase.lifecycle?.teardown) {
      await executeLifecycleActions(testCase.lifecycle.teardown, 'test', lifecycleContext);
    }
    
    return {
      testCaseId: testCase.id,
      passed: false,
      assertions: [networkErrorAssertion],
      summary: { total: 1, passed: 0, failed: 1, passRate: 0 },
      extracted: lifecycleContext.extractedVars,
      response,
      duration
    };
  }
  
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
