# TSpec DSL User Documentation

**Test Specification Domain-Specific Language v1.0**

A multi-protocol testing DSL designed for Developer + AI collaboration.

---

## Table of Contents

1. [Introduction](./01-introduction.md)
2. [Quick Start](./02-quick-start.md)
3. [File Specification](./03-file-specification.md)
4. [Core Structure](./04-core-structure.md)
5. [Field Reference](./05-field-reference.md)
6. [Variables and Expressions](./06-variables-expressions.md)
7. [Data-Driven Testing](./07-data-driven-testing.md)
8. [Assertions](./08-assertions.md)
9. [Template Inheritance](./09-template-inheritance.md)
10. [Protocol Reference](./10-protocol-reference.md)
11. [API Reference](./11-api-reference.md)
12. [Examples](./12-examples.md)
13. [Test Suites](./13-test-suites.md)

---

## Overview

TSpec (Test Specification) is a YAML-based domain-specific language for defining API test cases. It is designed with two primary goals:

- **AI Generation Accuracy**: Clear, unambiguous structure optimized for LLM generation
- **Developer Maintainability**: Reuse mechanisms, data-driven testing, and unified structure

### Key Features

- Multi-protocol support (HTTP, gRPC, with extensibility for WebSocket, GraphQL)
- Template inheritance for code reuse
- Data-driven parameterized testing
- Built-in variable system with functions
- Comprehensive assertion types
- Lifecycle hooks for setup/teardown
- Test suites for organizing related tests with shared configuration

### File Extensions

**Test Cases** (`.tspec`):
- `.http.tspec` - HTTP/HTTPS tests
- `.grpc.tspec` - gRPC tests
- `.graphql.tspec` - GraphQL tests (reserved)

**Test Suites** (`.tsuite`):
- `.http.tsuite` - HTTP test suite
- `.grpc.tsuite` - gRPC test suite
- `*.tsuite` - Mixed protocol suite

---

## Installation

```bash
npm install @boolesai/tspec
```

## Basic Usage

```javascript
import { parseTestCases, scheduler } from '@boolesai/tspec';

// Parse test cases from a .tspec file
const testCases = parseTestCases('./tests/login.http.tspec', {
  params: { username: 'testuser' },
  env: { API_HOST: 'api.example.com' }
});

// Execute tests and get results
const result = await scheduler.schedule(testCases);

console.log(result.summary.passed); // number of passed tests
console.log(result.summary.passRate); // pass rate percentage
```

---

## License

MIT
