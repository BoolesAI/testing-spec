import type { Assertion } from '../parser/types.js';
import type { Response, AssertionResult, AssertionSummary } from './types.js';
export declare function loadAssertionInclude(includePath: string, baseDir: string): Assertion;
export declare function runAssertion(response: Response, assertion: Assertion, baseDir?: string): AssertionResult;
export declare function runAssertions(response: Response, assertions: Assertion[], baseDir?: string): AssertionResult[];
export declare function getAssertionSummary(results: AssertionResult[]): AssertionSummary;
export interface AssertResultsTestCase {
    id: string;
    assertions: Assertion[];
    extract?: Record<string, string>;
}
export interface AssertResultsOutput {
    testCaseId: string;
    passed: boolean;
    assertions: AssertionResult[];
    summary: AssertionSummary;
    extracted: Record<string, unknown>;
}
export declare function assertResults(response: Response, testCase: AssertResultsTestCase, baseDir?: string): AssertResultsOutput;
