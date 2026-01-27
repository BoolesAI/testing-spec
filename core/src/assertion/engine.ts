import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import type { Assertion } from '../parser/types.js';
import type { Response, AssertionResult, AssertionSummary, ComparisonOperator } from './types.js';
import { compareValues } from './operators.js';
import { extractJsonPath, extractByPath, extractVariables, extractRegex, extractXmlPath, coerceToString, coerceToNumber } from './extractors.js';

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
      : assertion.message || `Expected status ${expected}, got ${actual}`,
    deprecated: true,
    migrationHint: 'Use json_path with expression "$.status" instead'
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
      : assertion.message || `Expected gRPC code ${expected}, got ${actual}`,
    deprecated: true,
    migrationHint: 'Use json_path with expression "$.grpcCode" instead'
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
  // Use envelope for unified access if available, otherwise fall back to body
  const data = response._envelope || (typeof response.body === 'string' ? JSON.parse(response.body) : response.body);
  const expression = assertion.expression || '';
  const operator = (assertion.operator || 'exists') as ComparisonOperator;
  
  let actual: unknown;
  try {
    actual = extractJsonPath(data, expression);
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
      : assertion.message || `Proto field ${fieldPath}: expected ${operator} ${expected}, got ${actual}`,
    deprecated: true,
    migrationHint: `Use json_path with expression "$.body.${fieldPath}" instead`
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
      : assertion.message || `Header ${headerName}: expected ${operator} ${expected}, got ${actual}`,
    deprecated: true,
    migrationHint: `Use json_path with expression "$.header['${headerName}']" instead`
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

function assertString(response: Response, assertion: Assertion): AssertionResult {
  const data = response._envelope || (typeof response.body === 'string' ? JSON.parse(response.body) : response.body);
  const expression = assertion.expression || '';
  const operator = (assertion.operator || 'exists') as ComparisonOperator;
  
  let actual: unknown;
  try {
    const rawValue = extractJsonPath(data, expression);
    actual = coerceToString(rawValue);
  } catch (e) {
    const err = e as Error;
    return {
      passed: false,
      type: 'string',
      expression,
      expected: assertion.expected || assertion.pattern,
      actual: undefined,
      message: assertion.message || `String extraction failed: ${err.message}`
    };
  }
  
  const expected = assertion.expected ?? assertion.pattern ?? assertion.value;
  const passed = compareValues(actual, operator, expected);
  
  return {
    passed,
    type: 'string',
    expression,
    operator,
    expected,
    actual,
    message: passed 
      ? `String ${expression} ${operator} assertion passed` 
      : assertion.message || `String ${expression}: expected ${operator} ${expected}, got ${JSON.stringify(actual)}`
  };
}

function assertNumber(response: Response, assertion: Assertion): AssertionResult {
  const data = response._envelope || (typeof response.body === 'string' ? JSON.parse(response.body) : response.body);
  const expression = assertion.expression || '';
  const operator = (assertion.operator || 'exists') as ComparisonOperator;
  
  let actual: number | null;
  try {
    const rawValue = extractJsonPath(data, expression);
    actual = coerceToNumber(rawValue);
    
    if (actual === null && operator !== 'not_exists') {
      return {
        passed: false,
        type: 'number',
        expression,
        expected: assertion.expected,
        actual: rawValue,
        message: assertion.message || `Number ${expression}: value cannot be converted to number: ${JSON.stringify(rawValue)}`
      };
    }
  } catch (e) {
    const err = e as Error;
    return {
      passed: false,
      type: 'number',
      expression,
      expected: assertion.expected,
      actual: undefined,
      message: assertion.message || `Number extraction failed: ${err.message}`
    };
  }
  
  const expected = assertion.expected ?? assertion.value;
  const passed = compareValues(actual, operator, expected);
  
  return {
    passed,
    type: 'number',
    expression,
    operator,
    expected,
    actual,
    message: passed 
      ? `Number ${expression} ${operator} assertion passed` 
      : assertion.message || `Number ${expression}: expected ${operator} ${expected}, got ${actual}`
  };
}

function assertRegex(response: Response, assertion: Assertion): AssertionResult {
  const data = response._envelope || (typeof response.body === 'string' ? JSON.parse(response.body) : response.body);
  const expression = assertion.expression || '';
  const pattern = assertion.pattern || '';
  const extractGroup = assertion.extract_group ?? 0;
  const operator = (assertion.operator || 'exists') as ComparisonOperator;
  
  let sourceStr: string;
  let actual: string | null;
  
  try {
    const rawValue = extractJsonPath(data, expression);
    sourceStr = coerceToString(rawValue);
    actual = extractRegex(sourceStr, pattern, extractGroup);
  } catch (e) {
    const err = e as Error;
    return {
      passed: false,
      type: 'regex',
      expression,
      expected: assertion.expected,
      actual: undefined,
      message: assertion.message || `Regex extraction failed: ${err.message}`
    };
  }
  
  const expected = assertion.expected ?? assertion.value;
  const passed = compareValues(actual, operator, expected);
  
  return {
    passed,
    type: 'regex',
    expression,
    operator,
    expected,
    actual,
    message: passed 
      ? `Regex ${expression} ${operator} assertion passed` 
      : assertion.message || `Regex ${expression} (pattern: ${pattern}): expected ${operator} ${expected}, got ${JSON.stringify(actual)}`
  };
}

function assertXmlPath(response: Response, assertion: Assertion): AssertionResult {
  const expression = assertion.expression || '';
  const operator = (assertion.operator || 'exists') as ComparisonOperator;
  
  // Get XML content from response body
  const xmlString = typeof response.body === 'string' ? response.body : JSON.stringify(response.body);
  
  let actual: unknown;
  try {
    actual = extractXmlPath(xmlString, expression);
  } catch (e) {
    const err = e as Error;
    return {
      passed: false,
      type: 'xml_path',
      expression,
      expected: assertion.expected,
      actual: undefined,
      message: assertion.message || `XPath extraction failed: ${err.message}`
    };
  }
  
  const expected = assertion.expected ?? assertion.value;
  const passed = compareValues(actual, operator, expected);
  
  return {
    passed,
    type: 'xml_path',
    expression,
    operator,
    expected,
    actual,
    message: passed 
      ? `XPath ${expression} ${operator} assertion passed` 
      : assertion.message || `XPath ${expression}: expected ${operator} ${expected}, got ${JSON.stringify(actual)}`
  };
}

function assertFileExist(response: Response, assertion: Assertion): AssertionResult {
  const filePath = assertion.expression || '';
  
  try {
    const exists = fs.existsSync(filePath);
    
    return {
      passed: exists,
      type: 'file_exist',
      expression: filePath,
      expected: 'file exists',
      actual: exists ? 'file exists' : 'file not found',
      message: exists
        ? `File exists: ${filePath}`
        : assertion.message || `File not found: ${filePath}`
    };
  } catch (e) {
    const err = e as Error;
    return {
      passed: false,
      type: 'file_exist',
      expression: filePath,
      expected: 'file exists',
      actual: 'error',
      message: assertion.message || `File check error: ${err.message}`
    };
  }
}

function assertFileRead(response: Response, assertion: Assertion): AssertionResult {
  const filePath = assertion.expression || '';
  const operator = (assertion.operator || 'exists') as ComparisonOperator;
  
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return {
        passed: false,
        type: 'file_read',
        expression: filePath,
        expected: 'file exists',
        actual: 'file not found',
        message: assertion.message || `File not found: ${filePath}`
      };
    }
    
    // Read file content
    const content = fs.readFileSync(filePath, 'utf-8');
    const expected = assertion.expected ?? assertion.pattern ?? assertion.value;
    const passed = compareValues(content, operator, expected);
    
    // Truncate content for display if too long
    const displayContent = content.length > 100 ? content.substring(0, 100) + '...' : content;
    
    return {
      passed,
      type: 'file_read',
      expression: filePath,
      operator,
      expected,
      actual: displayContent,
      message: passed
        ? `File ${filePath} ${operator} assertion passed`
        : assertion.message || `File ${filePath}: expected ${operator} ${JSON.stringify(expected)}`
    };
  } catch (e) {
    const err = e as Error;
    return {
      passed: false,
      type: 'file_read',
      expression: filePath,
      expected: assertion.expected,
      actual: undefined,
      message: assertion.message || `File read error: ${err.message}`
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
  return assertionConfig as unknown as Assertion;
}

export function runAssertion(response: Response, assertion: Assertion, baseDir = '.'): AssertionResult {
  if (assertion.include) {
    const includedAssertion = loadAssertionInclude(assertion.include, baseDir);
    return runAssertion(response, includedAssertion, baseDir);
  }
  
  const type = assertion.type;
  
  switch (type) {
    // Primary assertion types
    case 'json_path':
      return assertJsonPath(response, assertion);
    
    case 'string':
      return assertString(response, assertion);
    
    case 'number':
      return assertNumber(response, assertion);
    
    case 'regex':
      return assertRegex(response, assertion);
    
    case 'xml_path':
      return assertXmlPath(response, assertion);
    
    case 'response_time':
      return assertResponseTime(response, assertion);
    
    case 'javascript':
      return assertJavaScript(response, assertion);
    
    // File assertion types
    case 'file_exist':
      return assertFileExist(response, assertion);
    
    case 'file_read':
      return assertFileRead(response, assertion);
    
    // Deprecated assertion types (still functional)
    case 'status_code':
      return assertStatusCode(response, assertion);
    
    case 'grpc_code':
      return assertGrpcCode(response, assertion);
    
    case 'header':
      return assertHeader(response, assertion);
    
    case 'proto_field':
      return assertProtoField(response, assertion);
    
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

export function assertResults(
  response: Response,
  testCase: AssertResultsTestCase,
  baseDir = '.'
): AssertResultsOutput {
  const assertionResults = runAssertions(response, testCase.assertions, baseDir);
  const extracted = testCase.extract ? extractVariables(response, testCase.extract) : {};
  const summary = getAssertionSummary(assertionResults);
  const passed = assertionResults.every(r => r.passed);
  
  return {
    testCaseId: testCase.id,
    passed,
    assertions: assertionResults,
    summary,
    extracted
  };
}
