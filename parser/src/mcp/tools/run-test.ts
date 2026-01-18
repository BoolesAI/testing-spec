import { generateTestCases, generateTestCasesFromString, type TestCase } from '../../parser/index.js';
import { executeTestCase, type TestResult as RunnerTestResult } from '../../runner/index.js';
import type { AssertionResult, AssertionSummary } from '../../assertion/types.js';
import fs from 'fs';

export interface RunTestParams {
  file_path?: string;
  content?: string;
  params?: Record<string, unknown>;
  env?: Record<string, string>;
  extracted?: Record<string, unknown>;
  timeout?: number;
}

export interface RunTestResult {
  testCaseId: string;
  passed: boolean;
  summary: AssertionSummary;
  assertions: AssertionResult[];
  extracted: Record<string, unknown>;
  response: {
    statusCode: number | undefined;
    body: unknown;
    headers: Record<string, string> | undefined;
    responseTime: number | undefined;
  };
  duration: number;
}

export interface MCPTool<TParams, TResult> {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (params: TParams) => Promise<TResult>;
}

export const tool: MCPTool<RunTestParams, RunTestResult | RunTestResult[]> = {
  name: 'run_test',
  description: 'Execute a test case from a .tspec file and return the results. Combines test generation, HTTP execution, and assertion validation.',
  inputSchema: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'Absolute path to the .tspec file'
      },
      content: {
        type: 'string',
        description: 'YAML content string (alternative to file_path)'
      },
      params: {
        type: 'object',
        description: 'Override parameters for variable substitution',
        additionalProperties: true
      },
      env: {
        type: 'object',
        description: 'Environment variables',
        additionalProperties: { type: 'string' }
      },
      extracted: {
        type: 'object',
        description: 'Previously extracted variables from other test cases',
        additionalProperties: true
      },
      timeout: {
        type: 'number',
        description: 'Request timeout in milliseconds (default: 30000)',
        default: 30000
      }
    },
    oneOf: [
      { required: ['file_path'] },
      { required: ['content'] }
    ]
  },
  
  async handler(params: RunTestParams): Promise<RunTestResult | RunTestResult[]> {
    const { file_path, content, params: inputParams = {}, env = {}, extracted = {}, timeout = 30000 } = params;
    
    const options = {
      params: inputParams,
      env,
      extracted
    };
    
    let testCases: TestCase[];
    
    if (file_path) {
      if (!fs.existsSync(file_path)) {
        throw new Error(`File not found: ${file_path}`);
      }
      testCases = generateTestCases(file_path, options);
    } else if (content) {
      testCases = generateTestCasesFromString(content, options);
    } else {
      throw new Error('Either file_path or content must be provided');
    }
    
    // Only support HTTP protocol for now
    const httpTestCases = testCases.filter(tc => tc.protocol === 'http');
    if (httpTestCases.length === 0) {
      throw new Error('No HTTP test cases found. Currently only HTTP protocol is supported.');
    }
    
    const results: RunTestResult[] = [];
    
    for (const testCase of httpTestCases) {
      const result = await executeTestCase(testCase, { timeout });
      results.push(formatResult(result));
    }
    
    return results.length === 1 ? results[0] : results;
  }
};

function formatResult(result: RunnerTestResult): RunTestResult {
  return {
    testCaseId: result.testCaseId,
    passed: result.passed,
    summary: result.summary,
    assertions: result.assertions,
    extracted: result.extracted,
    response: {
      statusCode: result.response.statusCode,
      body: result.response.body,
      headers: result.response.headers,
      responseTime: result.response.responseTime
    },
    duration: result.duration
  };
}
