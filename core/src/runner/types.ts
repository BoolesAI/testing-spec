import type { TestCase } from '../parser/index.js';
import type { Response, AssertionResult, AssertionSummary } from '../assertion/types.js';
import type { ProtocolType } from '../parser/types.js';

export interface TestRunner {
  execute(testCase: TestCase): Promise<Response>;
}

export interface HttpRunnerOptions {
  timeout?: number;
  followRedirects?: boolean;
  maxRedirects?: number;
  validateStatus?: (status: number) => boolean;
  headers?: Record<string, string>;
}

export interface RunnerOptions extends HttpRunnerOptions {
  protocol?: ProtocolType;
}

export interface TestResult {
  testCaseId: string;
  passed: boolean;
  assertions: AssertionResult[];
  summary: AssertionSummary;
  extracted: Record<string, unknown>;
  response: Response;
  duration: number;
}
