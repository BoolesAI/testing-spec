import { generateTestCases, generateTestCasesFromString, type TestCase, type TSpecMetadata, type Assertion, type DataRow } from '../../parser/index.js';
import fs from 'fs';

export interface GenerateTestsParams {
  file_path?: string;
  content?: string;
  params?: Record<string, unknown>;
  env?: Record<string, string>;
  extracted?: Record<string, unknown>;
}

export interface GeneratedTestCase {
  id: string;
  description: string;
  protocol: string | null;
  request: unknown;
  assertions: Assertion[];
  extract?: Record<string, string>;
  metadata: TSpecMetadata;
  _dataRow?: DataRow;
}

export interface GenerateTestsResult {
  count: number;
  testCases: GeneratedTestCase[];
}

export interface MCPTool<TParams, TResult> {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (params: TParams) => Promise<TResult>;
}

export const tool: MCPTool<GenerateTestsParams, GenerateTestsResult> = {
  name: 'generate_test_cases',
  description: 'Generate test cases from a .tspec file with variable substitution and data-driven parameterization.',
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
      }
    },
    oneOf: [
      { required: ['file_path'] },
      { required: ['content'] }
    ]
  },
  
  async handler(params: GenerateTestsParams): Promise<GenerateTestsResult> {
    const { file_path, content, params: inputParams = {}, env = {}, extracted = {} } = params;
    
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
    
    return {
      count: testCases.length,
      testCases: testCases.map(tc => ({
        id: tc.id,
        description: tc.description,
        protocol: tc.protocol,
        request: tc.request,
        assertions: tc.assertions,
        extract: tc.extract,
        metadata: tc.metadata,
        _dataRow: tc._dataRow
      }))
    };
  }
};
