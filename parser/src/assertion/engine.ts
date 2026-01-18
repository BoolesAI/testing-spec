import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import type { Assertion } from '../parser/types.js';
import type { Response, AssertionResult, AssertionSummary, ComparisonOperator } from './types.js';
import { compareValues } from './operators.js';
import { extractJsonPath, extractByPath } from './extractors.js';

interface AssertionLibrary {
  definitions: Array<{ id: string; [key: string]: unknown }>;
}

function assertStatusCode(response: Response, assertion: Assertion): AssertionResult {
  const actual = response.statusCode || response.status;
  const expected = assertion.expected as number;
  const passed = actual === expected;
  
  return {
    passed,
    type: 'status_code',
    expected,
    actual,
    message: passed 
      ? `Status code is ${expected}` 
      : assertion.message || `Expected status ${expected}, got ${actual}`
  };
}

function assertGrpcCode(response: Response, assertion: Assertion): AssertionResult {
  const actual = response.grpcCode || response.code;
  const expected = assertion.expected as number;
  const passed = actual === expected;
  
  return {
    passed,
    type: 'grpc_code',
    expected,
    actual,
    message: passed 
      ? `gRPC code is ${expected}` 
      : assertion.message || `Expected gRPC code ${expected}, got ${actual}`
  };
}

function assertResponseTime(response: Response, assertion: Assertion): AssertionResult {
  const actual = response.responseTime || response.duration || 0;
  const maxMs = assertion.max_ms || 0;
  const passed = actual <= maxMs;
  
  return {
    passed,
    type: 'response_time',
    expected: `<= ${maxMs}ms`,
    actual: `${actual}ms`,
    message: passed 
      ? `Response time ${actual}ms is within ${maxMs}ms limit` 
      : assertion.message || `Response time ${actual}ms exceeds ${maxMs}ms limit`
  };
}

function assertJsonPath(response: Response, assertion: Assertion): AssertionResult {
  const body = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
  const expression = assertion.expression || '';
  const operator = (assertion.operator || 'exists') as ComparisonOperator;
  
  let actual: unknown;
  try {
    actual = extractJsonPath(body, expression);
  } catch (e) {
    const err = e as Error;
    return {
      passed: false,
      type: 'json_path',
      expression,
      expected: assertion.expected || assertion.pattern,
      actual: undefined,
      message: assertion.message || `JSONPath extraction failed: ${err.message}`
    };
  }
  
  const expected = assertion.expected ?? assertion.pattern ?? assertion.value;
  const passed = compareValues(actual, operator, expected);
  
  return {
    passed,
    type: 'json_path',
    expression,
    operator,
    expected,
    actual,
    message: passed 
      ? `JSONPath ${expression} ${operator} assertion passed` 
      : assertion.message || `JSONPath ${expression}: expected ${operator} ${expected}, got ${JSON.stringify(actual)}`
  };
}

function assertProtoField(response: Response, assertion: Assertion): AssertionResult {
  const body = response.body;
  const fieldPath = assertion.path || '';
  const operator = (assertion.operator || 'exists') as ComparisonOperator;
  
  const actual = extractByPath(body, fieldPath);
  const expected = assertion.expected ?? assertion.value;
  const passed = compareValues(actual, operator, expected);
  
  return {
    passed,
    type: 'proto_field',
    path: fieldPath,
    operator,
    expected,
    actual,
    message: passed 
      ? `Proto field ${fieldPath} ${operator} assertion passed` 
      : assertion.message || `Proto field ${fieldPath}: expected ${operator} ${expected}, got ${actual}`
  };
}

function assertHeader(response: Response, assertion: Assertion): AssertionResult {
  const headers = response.headers || {};
  const headerName = assertion.name || '';
  const operator = (assertion.operator || 'exists') as ComparisonOperator;
  
  const headerKey = Object.keys(headers).find(k => k.toLowerCase() === headerName.toLowerCase());
  const actual = headerKey ? headers[headerKey] : undefined;
  const expected = assertion.value;
  const passed = compareValues(actual, operator, expected);
  
  return {
    passed,
    type: 'header',
    name: headerName,
    operator,
    expected,
    actual,
    message: passed 
      ? `Header ${headerName} ${operator} assertion passed` 
      : assertion.message || `Header ${headerName}: expected ${operator} ${expected}, got ${actual}`
  };
}

function assertJavaScript(response: Response, assertion: Assertion): AssertionResult {
  const source = assertion.source || '';
  
  try {
    const fn = new Function('response', 'body', 'headers', 'statusCode', source) as (
      response: Response,
      body: unknown,
      headers: Record<string, string> | undefined,
      statusCode: number | undefined
    ) => unknown;
    const body = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
    const result = fn(response, body, response.headers, response.statusCode);
    const passed = Boolean(result);
    
    return {
      passed,
      type: 'javascript',
      actual: result,
      message: passed 
        ? 'JavaScript assertion passed' 
        : assertion.message || 'JavaScript assertion failed'
    };
  } catch (e) {
    const err = e as Error;
    return {
      passed: false,
      type: 'javascript',
      actual: undefined,
      message: assertion.message || `JavaScript assertion error: ${err.message}`
    };
  }
}

export function loadAssertionInclude(includePath: string, baseDir: string): Assertion {
  const [filePath, definitionId] = includePath.split('#');
  const fullPath = path.resolve(baseDir, filePath);
  
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Assertion include file not found: ${fullPath}`);
  }
  
  const content = fs.readFileSync(fullPath, 'utf-8');
  const assertionLib = yaml.load(content) as AssertionLibrary;
  
  if (!assertionLib.definitions) {
    throw new Error(`Invalid assertion library format: ${fullPath}`);
  }
  
  const definition = assertionLib.definitions.find(d => d.id === definitionId);
  if (!definition) {
    throw new Error(`Assertion definition not found: ${definitionId} in ${fullPath}`);
  }
  
  const { id: _id, ...assertionConfig } = definition;
  return assertionConfig as Assertion;
}

export function runAssertion(response: Response, assertion: Assertion, baseDir = '.'): AssertionResult {
  if (assertion.include) {
    const includedAssertion = loadAssertionInclude(assertion.include, baseDir);
    return runAssertion(response, includedAssertion, baseDir);
  }
  
  const type = assertion.type;
  
  switch (type) {
    case 'status_code':
      return assertStatusCode(response, assertion);
    
    case 'grpc_code':
      return assertGrpcCode(response, assertion);
    
    case 'response_time':
      return assertResponseTime(response, assertion);
    
    case 'json_path':
      return assertJsonPath(response, assertion);
    
    case 'proto_field':
      return assertProtoField(response, assertion);
    
    case 'header':
      return assertHeader(response, assertion);
    
    case 'javascript':
      return assertJavaScript(response, assertion);
    
    default:
      return {
        passed: false,
        type: type || 'unknown',
        message: `Unknown assertion type: ${type}`
      };
  }
}

export function runAssertions(response: Response, assertions: Assertion[], baseDir = '.'): AssertionResult[] {
  return assertions.map(assertion => runAssertion(response, assertion, baseDir));
}

export function getAssertionSummary(results: AssertionResult[]): AssertionSummary {
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;
  const passRate = total > 0 ? (passed / total) * 100 : 0;
  
  return { total, passed, failed, passRate };
}
