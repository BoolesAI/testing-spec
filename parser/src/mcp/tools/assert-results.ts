import { assertResults, type Response, type Assertion, type AssertionResult, type AssertionSummary } from '../../core/index.js';

export interface AssertResultsParams {
  response: Response;
  test_case: {
    id: string;
    assertions: Assertion[];
    extract?: Record<string, string>;
  };
  base_dir?: string;
}

export interface AssertResultsResult {
  testCaseId: string;
  passed: boolean;
  summary: AssertionSummary;
  assertions: AssertionResult[];
  extracted: Record<string, unknown>;
}

export interface MCPTool<TParams, TResult> {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (params: TParams) => Promise<TResult>;
}

export const tool: MCPTool<AssertResultsParams, AssertResultsResult> = {
  name: 'assert_results',
  description: 'Run assertions against test execution results. Validates response against test case assertions and extracts variables.',
  inputSchema: {
    type: 'object',
    properties: {
      response: {
        type: 'object',
        description: 'The actual response from test execution',
        properties: {
          statusCode: {
            type: 'number',
            description: 'HTTP status code'
          },
          body: {
            description: 'Response body (object or string)'
          },
          headers: {
            type: 'object',
            description: 'Response headers',
            additionalProperties: { type: 'string' }
          },
          responseTime: {
            type: 'number',
            description: 'Response time in milliseconds'
          }
        },
        required: ['statusCode', 'body']
      },
      test_case: {
        type: 'object',
        description: 'The test case object (from generate_test_cases)',
        properties: {
          id: { type: 'string' },
          assertions: { type: 'array' },
          extract: { type: 'object' }
        },
        required: ['id', 'assertions']
      },
      base_dir: {
        type: 'string',
        description: 'Base directory for assertion includes (default: current directory)'
      }
    },
    required: ['response', 'test_case']
  },
  
  async handler(params: AssertResultsParams): Promise<AssertResultsResult> {
    const { response, test_case, base_dir = process.cwd() } = params;
    
    const testCase = {
      id: test_case.id,
      assertions: test_case.assertions,
      extract: test_case.extract,
      description: '',
      metadata: {} as never,
      protocol: null,
      request: undefined,
      _raw: {} as never
    };
    
    const result = assertResults(response, testCase, { baseDir: base_dir });
    
    return {
      testCaseId: result.testCaseId,
      passed: result.passed,
      summary: result.summary,
      assertions: result.assertions,
      extracted: result.extracted
    };
  }
};
