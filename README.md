# TSpec - Test Specification DSL

A multi-protocol testing DSL designed for Developer + AI collaboration.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Overview

TSpec (Test Specification) is a YAML-based domain-specific language for defining API test cases. It provides a structured, readable format optimized for both AI-assisted test generation and developer maintainability.

### Key Features

- 🤖 **AI-Optimized**: Clear structure and metadata designed for accurate LLM-based test generation
- 🔌 **Multi-Protocol**: HTTP, gRPC support with extensibility for WebSocket and GraphQL
- 🔄 **Template Inheritance**: Reuse test configurations across multiple test cases
- 📊 **Data-Driven Testing**: Parameterized testing with multiple data sources
- 🔧 **Variable System**: Built-in functions and dynamic variable substitution
- ✅ **Comprehensive Assertions**: Rich set of assertion types for thorough validation
- 🎯 **Lifecycle Hooks**: Setup and teardown for test isolation

## Quick Example

```yaml
version: "1.0"
description: "Verify successful login with valid credentials"

metadata:
  ai_prompt: |
    Test that a user with valid credentials can successfully login
    and receive a JWT token in the response.
  tags: ["auth", "login", "smoke"]

environment:
  host: "${API_HOST|api.example.com}"
  scheme: "https"

variables:
  username: "test_user_001"
  request_id: "${uuid}"

http:
  method: "POST"
  path: "/v1/auth/login"
  headers:
    Content-Type: "application/json"
    X-Request-ID: "req_${request_id}"
  body:
    json:
      username: "${username}"
      password: "${env.TEST_PASSWORD}"

assertions:
  - type: "status_code"
    expected: 200
  - type: "json_path"
    expression: "$.data.token"
    operator: "exists"
  - type: "response_time"
    max_ms: 1000

extract:
  token: "$.data.token"
  user_id: "$.data.user.id"
```

## Installation

```bash
npm install @boolesai/tspec
```

## Usage

### As a Library

```javascript
import { parseTestCases, assertResults } from '@boolesai/tspec';

// Parse test cases from a .tspec file
const testCases = parseTestCases('./tests/login.http.tspec', {
  params: { username: 'testuser' },
  env: { API_HOST: 'api.example.com' }
});

// Execute tests and assert results
const response = await executeRequest(testCases[0]);
const result = assertResults(response, testCases[0]);

console.log(result.passed); // true/false
console.log(result.summary); // { total: 4, passed: 4, failed: 0, passRate: 100 }
```
    
## Documentation

For complete documentation, see the [docs](./doc) directory:

- [Introduction](./doc/01-introduction.md) - Overview and design goals
- [Quick Start](./doc/02-quick-start.md) - Get started with TSpec
- [File Specification](./doc/03-file-specification.md) - File naming and structure
- [Core Structure](./doc/04-core-structure.md) - Understanding the TSpec format
- [Field Reference](./doc/05-field-reference.md) - Complete field documentation
- [Variables and Expressions](./doc/06-variables-expressions.md) - Variable system
- [Data-Driven Testing](./doc/07-data-driven-testing.md) - Parameterized tests
- [Assertions](./doc/08-assertions.md) - Validation and assertion types
- [Template Inheritance](./doc/09-template-inheritance.md) - Reuse test configurations
- [Protocol Reference](./doc/10-protocol-reference.md) - HTTP, gRPC protocol details
- [API Reference](./doc/11-api-reference.md) - Parser API documentation
- [Examples](./doc/12-examples.md) - Real-world examples

📖 **[View Full Documentation](./doc/README.md)**

## File Extensions

TSpec uses protocol-specific file extensions:

- `.http.tspec` - HTTP/HTTPS tests
- `.grpc.tspec` - gRPC tests
- `.graphql.tspec` - GraphQL tests (reserved)
- `.ws.tspec` - WebSocket tests (reserved)

## Why TSpec?

### For AI Systems
- Structured metadata with `ai_prompt` for context
- Clear, unambiguous field definitions
- Predictable structure optimized for LLM generation

### For Developers
- Template inheritance reduces duplication
- Data-driven testing for comprehensive coverage
- Version control friendly (YAML format)
- Co-locate tests with source code
- Unified structure across protocols

## License

MIT

## Contributing

Contributions are welcome! Please check the [documentation](./doc) for details on the DSL structure and design principles.