# TSpec DSL User Documentation

**Test Specification Domain-Specific Language v1.0**

A multi-protocol testing DSL designed for Developer + AI collaboration.

---

## Table of Contents

1. [Introduction](/docs.html#01-introduction)
2. [Quick Start](/docs.html#02-quick-start)
3. [File Specification](/docs.html#03-file-specification)
4. [Core Structure](/docs.html#04-core-structure)
5. [Field Reference](/docs.html#05-field-reference)
6. [Variables and Expressions](/docs.html#06-variables-expressions)
7. [Data-Driven Testing](/docs.html#07-data-driven-testing)
8. [Assertions](/docs.html#08-assertions)
9. [Template Inheritance](/docs.html#09-template-inheritance)
10. [Protocol Reference](/docs.html#10-protocol-reference)
11. [API Reference](/docs.html#11-api-reference)
12. [Examples](/docs.html#12-examples)
13. [Test Suites](/docs.html#13-test-suites)
14. [Proxy Server](/docs.html#14-proxy-server)

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
- Proxy server support for remote test execution

### File Extensions

**Test Cases** (`.tcase`):
- `.http.tcase` - HTTP/HTTPS tests
- `.grpc.tcase` - gRPC tests
- `.graphql.tcase` - GraphQL tests (reserved)

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

// Parse test cases from a .tcase file
const testCases = parseTestCases('./tests/login.http.tcase', {
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
