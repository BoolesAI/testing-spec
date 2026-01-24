# @boolesai/tspec

Core library for TSpec - a multi-protocol testing DSL designed for Developer + AI collaboration.

[![npm version](https://img.shields.io/npm/v/@boolesai/tspec.svg)](https://www.npmjs.com/package/@boolesai/tspec)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
npm install @boolesai/tspec
```

## Features

- **Parser**: Parse and validate `.tspec` test specification files
- **Runner**: Execute test cases with HTTP protocol support
- **Assertion**: Rich assertion engine with multiple validation types
- **Scheduler**: Concurrent test execution with configurable parallelism

## Quick Start

```typescript
import { 
  parseTestCases, 
  validateTestCase,
  scheduler,
  executeTestCase 
} from '@boolesai/tspec';

// Validate a test file
const validation = validateTestCase('./tests/login.http.tspec');
if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}

// Parse test cases
const testCases = parseTestCases('./tests/login.http.tspec', {
  params: { username: 'testuser' },
  env: { API_HOST: 'api.example.com' }
});

// Execute a single test
const result = await executeTestCase(testCases[0]);
console.log(result.passed); // true/false
console.log(result.summary); // { total: 4, passed: 4, failed: 0, passRate: 100 }

// Execute multiple tests with concurrency
const scheduleResult = await scheduler.schedule(testCases, { concurrency: 5 });
console.log(scheduleResult.summary);
```

## Module Exports

The package provides both unified and modular exports:

```typescript
// Unified import
import { parseTestCases, executeTestCase, scheduler } from '@boolesai/tspec';

// Modular imports
import { parseTestCases, validateTestCase } from '@boolesai/tspec/parser';
import { executeTestCase, registry } from '@boolesai/tspec/runner';
import { runAssertions, extractVariables } from '@boolesai/tspec/assertion';
import { scheduler, TestScheduler } from '@boolesai/tspec/scheduler';
```

## API Reference

### Parser Module

| Function | Description |
|----------|-------------|
| `validateTestCase(filePath)` | Validate a `.tspec` file |
| `parseTestCases(filePath, options?)` | Parse file into executable test cases |
| `parseTestCasesFromString(content, options?)` | Parse YAML string content |

### Runner Module

| Function | Description |
|----------|-------------|
| `executeTestCase(testCase, options?)` | Execute a single test case |
| `createRunner(protocol, options?)` | Create a protocol-specific runner |
| `registry` | Protocol executor registry |

### Assertion Module

| Function | Description |
|----------|-------------|
| `runAssertions(response, assertions)` | Run all assertions against a response |
| `runAssertion(response, assertion)` | Run a single assertion |
| `extractVariables(response, extractMap)` | Extract variables from response |
| `getAssertionSummary(results)` | Get summary of assertion results |

### Scheduler Module

| Function | Description |
|----------|-------------|
| `scheduler.schedule(testCases, options?)` | Execute tests with concurrency |
| `scheduler.scheduleByType(testCases, options?)` | Execute tests grouped by protocol |

## Supported Protocols

| Protocol | Status |
|----------|--------|
| HTTP/HTTPS | Supported |
| gRPC | Planned |
| GraphQL | Planned |
| WebSocket | Planned |

## Assertion Types

- `status_code` - HTTP status code validation
- `json_path` - JSONPath expression validation
- `header` - HTTP header validation
- `response_time` - Response time threshold
- `javascript` - Custom JavaScript validation
- `grpc_code` - gRPC status code (planned)
- `proto_field` - Protocol buffer field (planned)

## Documentation

For complete TSpec DSL documentation, see the [docs](../doc) directory.

## Related

- [@boolesai/tspec-cli](https://www.npmjs.com/package/@boolesai/tspec-cli) - Command-line interface for TSpec

## License

MIT
