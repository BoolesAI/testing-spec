# 11. API Reference

This section documents the JavaScript API for the TSpec parser.

## Installation

```bash
npm install tspec-parser
```

## Core Functions

### `generateTestCases(filePath, options)`

Parse a `.tcase` file and generate executable test cases.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `filePath` | string | Yes | Path to the `.tcase` file |
| `options` | object | No | Generation options |
| `options.params` | object | No | Input parameters (override variables) |
| `options.env` | object | No | Environment variables |
| `options.extracted` | object | No | Previously extracted variables |

**Returns**: `TestCase[]`

**Example**:

```javascript
import { generateTestCases } from 'tspec-parser';

const testCases = generateTestCases('./tests/login.http.tcase', {
  params: { username: 'custom_user' },
  env: { 
    API_HOST: 'api.staging.example.com',
    AUTH_TOKEN: 'secret-token'
  },
  extracted: { previous_user_id: 'U123' }
});

console.log(testCases.length);        // Number of generated cases
console.log(testCases[0].id);         // Test case ID
console.log(testCases[0].protocol);   // 'http', 'grpc', etc.
console.log(testCases[0].request);    // Protocol-specific request
```

---

### `generateTestCasesFromString(content, options)`

Parse YAML content directly and generate test cases.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `content` | string | Yes | YAML content |
| `options` | object | No | Generation options |
| `options.baseDir` | string | No | Base directory for relative paths |
| `options.params` | object | No | Input parameters |
| `options.env` | object | No | Environment variables |
| `options.extracted` | object | No | Previously extracted variables |

**Returns**: `TestCase[]`

**Example**:

```javascript
import { generateTestCasesFromString } from 'tspec-parser';

const yaml = `
version: "1.0"
description: "Inline test"
metadata:
  prompt: "Test something"
  related_code: ["src/test.js"]
  test_category: "functional"
  risk_level: "low"
  tags: ["test"]
  priority: "low"
  timeout: "5s"
http:
  method: "GET"
  path: "/api/health"
assertions:
  - type: "json_path"
    expression: "$.status"
    operator: "equals"
    expected: 200
`;

const testCases = generateTestCasesFromString(yaml, {
  baseDir: '/path/to/project'
});
```

---

### `assertResults(response, testCase, options)`

Run assertions against a response.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `response` | object | Yes | Response object |
| `response.statusCode` | number | Yes | HTTP status code |
| `response.body` | object/string | Yes | Response body |
| `response.headers` | object | No | Response headers |
| `response.responseTime` | number | No | Response time in ms |
| `testCase` | TestCase | Yes | Test case from `generateTestCases` |
| `options` | object | No | Assertion options |
| `options.baseDir` | string | No | Base directory for assertion includes |

**Returns**: `TestResult`

**Example**:

```javascript
import { generateTestCases, assertResults } from 'tspec-parser';

const testCases = generateTestCases('./test.http.tcase');

// Execute request (using your HTTP client)
const response = {
  statusCode: 200,
  body: { data: { token: 'abc123', user: { id: 'U1' } } },
  headers: { 'content-type': 'application/json' },
  responseTime: 150
};

const result = assertResults(response, testCases[0]);

console.log(result.passed);           // true/false
console.log(result.summary);          // { total, passed, failed, passRate }
console.log(result.assertions);       // Individual assertion results
console.log(result.extracted);        // Extracted variables
```

---

### `assertMultipleResults(results, options)`

Assert results for multiple test cases.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `results` | array | Yes | Array of `{response, testCase}` objects |
| `options` | object | No | Assertion options |

**Returns**: `TestResult[]`

**Example**:

```javascript
import { assertMultipleResults } from 'tspec-parser';

const results = [
  { response: response1, testCase: testCases[0] },
  { response: response2, testCase: testCases[1] }
];

const testResults = assertMultipleResults(results);
```

---

## Type Definitions

### TestCase

```typescript
interface TestCase {
  id: string;                    // Unique identifier
  description: string;           // Test description
  metadata: Metadata;            // Test metadata
  protocol: string;              // 'http', 'grpc', etc.
  request: object;               // Protocol-specific request
  assertions: Assertion[];       // Assertion configurations
  extract?: object;              // Variable extraction config
  output?: object;               // Output configuration
  lifecycle?: Lifecycle;         // Setup/teardown hooks
  environment?: Environment;     // Environment config
  _dataRow?: object;             // Data row (for parameterized)
  _raw?: object;                 // Raw parsed spec
}
```

### TestResult

```typescript
interface TestResult {
  testCaseId: string;            // Test case identifier
  passed: boolean;               // Overall pass/fail
  assertions: AssertionResult[]; // Individual results
  summary: Summary;              // Assertion summary
  extracted: object;             // Extracted variables
}

interface AssertionResult {
  passed: boolean;
  type: string;
  expected?: any;
  actual?: any;
  message: string;
  expression?: string;           // For json_path
  operator?: string;
}

interface Summary {
  total: number;
  passed: number;
  failed: number;
  passRate: number;              // 0-100
}
```

---

## Utility Functions

### `parseYamlFile(filePath)`

Parse a YAML file.

```javascript
import { parseYamlFile } from 'tspec-parser';
const spec = parseYamlFile('./test.http.tcase');
```

### `parseYamlString(content)`

Parse YAML string content.

```javascript
import { parseYamlString } from 'tspec-parser';
const spec = parseYamlString(yamlContent);
```

### `validateTspec(spec)`

Validate a parsed spec object.

```javascript
import { validateTspec } from 'tspec-parser';
const { valid, errors } = validateTspec(spec);
if (!valid) {
  console.error('Validation errors:', errors);
}
```

### `validateSuite(suite)`

Validate a parsed suite object.

```javascript
import { validateSuite } from 'tspec-parser';
const { valid, errors } = validateSuite(suite);
if (!valid) {
  console.error('Suite validation errors:', errors);
}
```

### `parseSuiteFile(filePath)`

Parse a `.tsuite` file.

```javascript
import { parseSuiteFile } from 'tspec-parser';
const suite = parseSuiteFile('./tests/api.http.tsuite');
console.log(suite.suite.name);     // Suite name
console.log(suite.suite.tests);    // Test references
```

### `isSuiteFile(filePath)`

Check if a file is a suite file.

```javascript
import { isSuiteFile } from 'tspec-parser';
console.log(isSuiteFile('./api.http.tsuite'));  // true
console.log(isSuiteFile('./test.http.tcase'));  // false
```

### `executeSuite(suitePath, options)`

Execute a test suite.

```javascript
import { executeSuite } from 'tspec-parser';

const result = await executeSuite('./tests/api.http.tsuite', {
  env: { API_HOST: 'localhost:3000' },
  parallel: true,
  concurrency: 3
});

console.log(result.suiteName);     // Suite name
console.log(result.passed);        // Overall pass/fail
console.log(result.testResults);   // Individual test results
```

### `replaceVariables(obj, context)`

Replace variables in an object.

```javascript
import { replaceVariables, buildVariableContext } from 'tspec-parser';

const context = buildVariableContext(spec, params, extracted);
const processed = replaceVariables(spec, context);
```

### `extractJsonPath(data, expression)`

Extract value using JSONPath.

```javascript
import { extractJsonPath } from 'tspec-parser';
const value = extractJsonPath(responseBody, '$.data.token');
```

### `runAssertions(response, assertions, baseDir)`

Run assertions manually.

```javascript
import { runAssertions, getAssertionSummary } from 'tspec-parser';

const results = runAssertions(response, testCase.assertions);
const summary = getAssertionSummary(results);
```

### `getBuiltinFunctions()`

Get list of built-in variable functions.

```javascript
import { getBuiltinFunctions } from 'tspec-parser';
console.log(getBuiltinFunctions()); // ['timestamp', 'uuid', 'random_int', 'now']
```

### `deepMerge(parent, child)`

Deep merge objects (for template inheritance).

```javascript
import { deepMerge } from 'tspec-parser';
const merged = deepMerge(templateSpec, testSpec);
```

### `loadDataFile(filePath, format)`

Load data file for parameterization.

```javascript
import { loadDataFile } from 'tspec-parser';
const rows = loadDataFile('./data/users.csv', 'csv');
```

---

## Complete Usage Example

```javascript
import { generateTestCases, assertResults } from 'tspec-parser';

async function runTests() {
  // 1. Generate test cases
  const testCases = generateTestCases('./tests/api/login.http.tcase', {
    env: {
      API_HOST: process.env.API_HOST || 'localhost:3000',
      TEST_PASSWORD: process.env.TEST_PASSWORD
    }
  });

  const results = [];

  for (const testCase of testCases) {
    // 2. Build request URL
    const baseUrl = testCase.request._baseUrl || 
                    `${testCase.environment?.scheme || 'http'}://${testCase.environment?.host}`;
    const url = `${baseUrl}${testCase.request.path}`;

    // 3. Execute request
    const startTime = Date.now();
    const response = await fetch(url, {
      method: testCase.request.method,
      headers: testCase.request.headers,
      body: testCase.request.body?.json 
            ? JSON.stringify(testCase.request.body.json) 
            : undefined
    });
    const responseTime = Date.now() - startTime;

    // 4. Parse response
    const body = await response.json();

    // 5. Assert results
    const result = assertResults({
      statusCode: response.status,
      body,
      headers: Object.fromEntries(response.headers),
      responseTime
    }, testCase);

    results.push(result);

    // 6. Log results
    console.log(`${result.passed ? '✓' : '✗'} ${testCase.id}`);
    if (!result.passed) {
      result.assertions
        .filter(a => !a.passed)
        .forEach(a => console.log(`  - ${a.message}`));
    }
  }

  // 7. Summary
  const passed = results.filter(r => r.passed).length;
  console.log(`\n${passed}/${results.length} tests passed`);
  
  return results.every(r => r.passed) ? 0 : 1;
}

process.exit(await runTests());
```
