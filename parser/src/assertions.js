import { JSONPath } from 'jsonpath-plus';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

/**
 * Extract value from JSON using JSONPath
 * @param {object} data - JSON object
 * @param {string} expression - JSONPath expression
 * @returns {*} Extracted value(s)
 */
export function extractJsonPath(data, expression) {
  try {
    const result = JSONPath({ path: expression, json: data });
    // Return single value if only one result, otherwise return array
    return result.length === 1 ? result[0] : result;
  } catch (error) {
    throw new Error(`JSONPath extraction failed: ${expression} - ${error.message}`);
  }
}

/**
 * Extract value from nested object using dot notation path
 * @param {object} data - Object
 * @param {string} path - Dot notation path like "user.name"
 * @returns {*} Extracted value
 */
export function extractByPath(data, pathStr) {
  const parts = pathStr.split('.');
  let current = data;
  
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[part];
  }
  
  return current;
}

/**
 * Assertion result structure
 * @typedef {Object} AssertionResult
 * @property {boolean} passed - Whether assertion passed
 * @property {string} type - Assertion type
 * @property {*} expected - Expected value
 * @property {*} actual - Actual value
 * @property {string} message - Result message
 * @property {string} [expression] - JSONPath or field expression
 */

/**
 * Compare values using specified operator
 * @param {*} actual - Actual value
 * @param {string} operator - Comparison operator
 * @param {*} expected - Expected value or pattern
 * @returns {boolean}
 */
function compareValues(actual, operator, expected) {
  switch (operator) {
    case 'equals':
    case 'eq':
      return actual === expected || JSON.stringify(actual) === JSON.stringify(expected);
    
    case 'not_equals':
    case 'neq':
      return actual !== expected;
    
    case 'exists':
      return actual !== undefined && actual !== null;
    
    case 'not_exists':
      return actual === undefined || actual === null;
    
    case 'not_empty':
      if (typeof actual === 'string') return actual.length > 0;
      if (Array.isArray(actual)) return actual.length > 0;
      return actual !== undefined && actual !== null;
    
    case 'contains':
      if (typeof actual === 'string') return actual.includes(expected);
      if (Array.isArray(actual)) return actual.includes(expected);
      return false;
    
    case 'not_contains':
      if (typeof actual === 'string') return !actual.includes(expected);
      if (Array.isArray(actual)) return !actual.includes(expected);
      return true;
    
    case 'matches':
      if (typeof actual !== 'string') return false;
      const regex = new RegExp(expected);
      return regex.test(actual);
    
    case 'gt':
      return Number(actual) > Number(expected);
    
    case 'gte':
      return Number(actual) >= Number(expected);
    
    case 'lt':
      return Number(actual) < Number(expected);
    
    case 'lte':
      return Number(actual) <= Number(expected);
    
    case 'type':
      return typeof actual === expected;
    
    case 'length':
      if (typeof actual === 'string' || Array.isArray(actual)) {
        return actual.length === Number(expected);
      }
      return false;
    
    default:
      throw new Error(`Unknown operator: ${operator}`);
  }
}

/**
 * Assert HTTP status code
 * @param {object} response - Response object with statusCode
 * @param {object} assertion - Assertion config
 * @returns {AssertionResult}
 */
function assertStatusCode(response, assertion) {
  const actual = response.statusCode || response.status;
  const expected = assertion.expected;
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

/**
 * Assert gRPC status code
 * @param {object} response - Response object with grpcCode
 * @param {object} assertion - Assertion config
 * @returns {AssertionResult}
 */
function assertGrpcCode(response, assertion) {
  const actual = response.grpcCode || response.code;
  const expected = assertion.expected;
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

/**
 * Assert response time
 * @param {object} response - Response object with responseTime
 * @param {object} assertion - Assertion config
 * @returns {AssertionResult}
 */
function assertResponseTime(response, assertion) {
  const actual = response.responseTime || response.duration;
  const maxMs = assertion.max_ms;
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

/**
 * Assert using JSONPath expression
 * @param {object} response - Response object with body
 * @param {object} assertion - Assertion config
 * @returns {AssertionResult}
 */
function assertJsonPath(response, assertion) {
  const body = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
  const expression = assertion.expression;
  const operator = assertion.operator || 'exists';
  
  let actual;
  try {
    actual = extractJsonPath(body, expression);
  } catch (e) {
    return {
      passed: false,
      type: 'json_path',
      expression,
      expected: assertion.expected || assertion.pattern,
      actual: undefined,
      message: assertion.message || `JSONPath extraction failed: ${e.message}`
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

/**
 * Assert Protobuf field
 * @param {object} response - Response object with body
 * @param {object} assertion - Assertion config
 * @returns {AssertionResult}
 */
function assertProtoField(response, assertion) {
  const body = response.body;
  const fieldPath = assertion.path;
  const operator = assertion.operator || 'exists';
  
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

/**
 * Assert HTTP header
 * @param {object} response - Response object with headers
 * @param {object} assertion - Assertion config
 * @returns {AssertionResult}
 */
function assertHeader(response, assertion) {
  const headers = response.headers || {};
  const headerName = assertion.name;
  const operator = assertion.operator || 'exists';
  
  // Case-insensitive header lookup
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

/**
 * Assert using JavaScript expression
 * @param {object} response - Response object
 * @param {object} assertion - Assertion config
 * @returns {AssertionResult}
 */
function assertJavaScript(response, assertion) {
  const source = assertion.source;
  
  try {
    // Create function context
    const fn = new Function('response', 'body', 'headers', 'statusCode', source);
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
    return {
      passed: false,
      type: 'javascript',
      actual: undefined,
      message: assertion.message || `JavaScript assertion error: ${e.message}`
    };
  }
}

/**
 * Load assertion definition from include path
 * @param {string} includePath - Include path like "assertions/common.yaml#common.success_status"
 * @param {string} baseDir - Base directory
 * @returns {object|null} Assertion definition
 */
export function loadAssertionInclude(includePath, baseDir) {
  const [filePath, definitionId] = includePath.split('#');
  const fullPath = path.resolve(baseDir, filePath);
  
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Assertion include file not found: ${fullPath}`);
  }
  
  const content = fs.readFileSync(fullPath, 'utf-8');
  const assertionLib = yaml.load(content);
  
  if (!assertionLib.definitions) {
    throw new Error(`Invalid assertion library format: ${fullPath}`);
  }
  
  const definition = assertionLib.definitions.find(d => d.id === definitionId);
  if (!definition) {
    throw new Error(`Assertion definition not found: ${definitionId} in ${fullPath}`);
  }
  
  // Return the assertion without the id field
  const { id, ...assertionConfig } = definition;
  return assertionConfig;
}

/**
 * Run a single assertion
 * @param {object} response - Response object
 * @param {object} assertion - Assertion config
 * @param {string} baseDir - Base directory for includes
 * @returns {AssertionResult}
 */
export function runAssertion(response, assertion, baseDir = '.') {
  // Handle include
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

/**
 * Run all assertions for a test case
 * @param {object} response - Response object
 * @param {object[]} assertions - Array of assertion configs
 * @param {string} baseDir - Base directory for includes
 * @returns {AssertionResult[]}
 */
export function runAssertions(response, assertions, baseDir = '.') {
  return assertions.map(assertion => runAssertion(response, assertion, baseDir));
}

/**
 * Extract variables from response using extract config
 * @param {object} response - Response object
 * @param {object} extractConfig - Extract configuration
 * @returns {object} Extracted variables
 */
export function extractVariables(response, extractConfig) {
  if (!extractConfig) {
    return {};
  }
  
  const body = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
  const extracted = {};
  
  for (const [varName, expression] of Object.entries(extractConfig)) {
    try {
      extracted[varName] = extractJsonPath(body, expression);
    } catch (e) {
      extracted[varName] = undefined;
    }
  }
  
  return extracted;
}

/**
 * Get assertion summary
 * @param {AssertionResult[]} results 
 * @returns {{total: number, passed: number, failed: number, passRate: number}}
 */
export function getAssertionSummary(results) {
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;
  const passRate = total > 0 ? (passed / total) * 100 : 0;
  
  return { total, passed, failed, passRate };
}
