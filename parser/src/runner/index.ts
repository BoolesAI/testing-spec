import type { TestCase } from '../parser/index.js';
import type { Response } from '../assertion/types.js';
import type { ProtocolType } from '../parser/types.js';
import { runAssertions, extractVariables, getAssertionSummary } from '../assertion/index.js';
import type { TestRunner, TestResult, RunnerOptions, HttpRunnerOptions } from './types.js';
import { HttpRunner } from './http/index.js';

export function createRunner(protocol: ProtocolType | null, options: RunnerOptions = {}): TestRunner {
  switch (protocol) {
    case 'http':
      return new HttpRunner(options);
    case 'grpc':
      throw new Error('gRPC runner not yet implemented');
    case 'graphql':
      throw new Error('GraphQL runner not yet implemented');
    case 'websocket':
      throw new Error('WebSocket runner not yet implemented');
    default:
      throw new Error(`Unknown protocol: ${protocol}`);
  }
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
export type { TestRunner, TestResult, RunnerOptions, HttpRunnerOptions } from './types.js';
