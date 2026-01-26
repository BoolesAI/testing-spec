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

### Primary Types (Recommended)

| Type | Description |
|------|-------------|
| `json_path` | JSONPath expression validation with unified response access (`$.status`, `$.header`, `$.body`) |
| `string` | Extract and coerce value to string before comparison |
| `number` | Extract and coerce value to number before comparison |
| `regex` | Extract value using regex capture groups |
| `xml_path` | XPath expression validation for XML responses |
| `response_time` | Response time threshold validation |
| `javascript` | Custom JavaScript validation |

### Deprecated Types (Still Functional)

| Type | Migration |
|------|-----------|
| `status_code` | Use `json_path` with `expression: "$.status"` |
| `grpc_code` | Use `json_path` with `expression: "$.grpcCode"` |
| `header` | Use `json_path` with `expression: "$.header['Name']"` |
| `proto_field` | Use `json_path` with `expression: "$.body.field.path"` |

## Build from Source

Prerequisites:
- Node.js >= 18.0.0
- npm >= 9.0.0

```bash
# Clone the repository
git clone https://github.com/boolesai/testing-spec.git
cd testing-spec/core

# Install dependencies
npm install

# Build the package
npm run build

# Generate TypeScript declarations
npm run types

# Build with types (recommended)
npm run package
```

### Build Output

- `dist/` - Compiled JavaScript (ESM and CJS)
- `types/` - TypeScript type definitions

### Development Mode

```bash
# Watch mode for development
npm run dev
```

### Link for Local Development

```bash
# In the core directory
npm link

# In your project directory
npm link @boolesai/tspec
```

## Documentation

For complete TSpec DSL documentation, see the [docs](../doc) directory.

## Related

- [@boolesai/tspec-cli](https://www.npmjs.com/package/@boolesai/tspec-cli) - Command-line interface for TSpec

## License

MIT
