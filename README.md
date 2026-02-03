<div align="center">
  <img src="https://github.com/BoolesAI/testing-spec/blob/main/assets/logo.png?raw=true" alt="Testing Spec Logo" width="128"/>
</div>

# TSpec - Test Specification DSL

A multi-protocol testing DSL designed for Developer + AI collaboration.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
![Badge](https://hitscounter.dev/api/hit?url=https%3A%2F%2Fgithub.com%2FBoolesAI%2Ftesting-spec&label=Visitors&icon=github&color=%233d8bfd&message=&style=flat&tz=UTC)

## Overview

TSpec (Test Specification) is a YAML-based domain-specific language for defining API test cases. It provides a structured, readable format optimized for both AI-assisted test generation and developer maintainability.

### Key Features

- **AI-Optimized**: Clear structure and metadata designed for accurate LLM-based test generation
- **Multi-Protocol**: HTTP, gRPC support with extensibility for WebSocket and GraphQL
- **Template Inheritance**: Reuse test configurations across multiple test cases
- **Data-Driven Testing**: Parameterized testing with multiple data sources
- **Variable System**: Built-in functions and dynamic variable substitution
- **Comprehensive Assertions**: Rich set of assertion types for thorough validation
- **Lifecycle Hooks**: Setup and teardown for test isolation

## Packages

| Package | Description |
|---------|-------------|
| [@boolesai/tspec](https://www.npmjs.com/package/@boolesai/tspec) | Core library for parsing, running, and asserting TSpec files |
| [@boolesai/tspec-cli](https://www.npmjs.com/package/@boolesai/tspec-cli) | Command-line interface for TSpec |
| [vscode-tspec](./vscode-extension/README.md) | Visual Studio Code extension for TSpec language support |
| [plugins](./plugins/README.md) | Protocol plugins for HTTP, Web UI, and custom protocols |
| [skills](./skills) | AI agent skills for TSpec MCP integration |
| [demo](./demo/README.md) | Bookstore API demo for TSpec functionality demonstration |

## Plugin Architecture

TSpec uses a plugin system to support multiple protocols. Each plugin provides:

- **Protocol Implementation**: Execute tests for specific protocols (HTTP, Web UI, etc.)
- **Schema Validation**: JSON Schema for protocol-specific request blocks
- **Custom Runners**: Protocol-specific test execution logic

### Official Plugins

| Plugin | Protocol | Description | Package |
|--------|----------|-------------|----------|
| [tspec-protocol-http](./plugins/tspec-protocol-http) | `http`, `https` | HTTP/HTTPS API testing with axios | `@tspec/http` |
| [tspec-protocol-web](./plugins/tspec-protocol-web) | `web` | Web browser UI testing with Puppeteer | `@tspec/web` |

### Using Plugins

**Install plugins:**
```bash
npm install -D @tspec/http @tspec/web
```

**Configure plugins** in `tspec.config.js`:
```javascript
module.exports = {
  plugins: [
    '@tspec/http',
    '@tspec/web'
  ],
  pluginOptions: {
    '@tspec/http': {
      timeout: 30000,
      followRedirects: true
    },
    '@tspec/web': {
      headless: true,
      timeout: 30000
    }
  }
};
```

**Run tests:**
```bash
tspec run tests/**/*.http.tcase  # HTTP tests
tspec run tests/**/*.web.tcase   # Web UI tests
```

For plugin development and custom protocol support, see [plugins/README.md](./plugins/README.md).

## Quick Start

### Using the CLI

```bash
# Install CLI globally
npm install -g @boolesai/tspec-cli

# Validate test files
tspec validate tests/*.tcase

# Run tests
tspec run tests/*.http.tcase

# Parse and inspect test cases
tspec parse tests/login.http.tcase --output json
```

### Using the VSCode Extension

The [vscode-tspec](./vscode-extension/README.md) extension provides a seamless testing experience directly within Visual Studio Code.

**Installation:**
```bash
# From VS Code Marketplace
code --install-extension boolesai.vscode-tspec
```

**Running Tests:**
1. Open the Testing view in VS Code (beaker icon in sidebar)
2. All `.tcase` files will be automatically discovered
3. Click the play button next to any test to run it
4. View real-time results with detailed assertion feedback

**Features:**
- Integrated test explorer with one-click test execution
- Syntax highlighting and IntelliSense support
- Real-time validation and diagnostics
- CodeLens integration for in-editor test running
- Automatic test discovery and file watching

See the [VSCode Extension README](./vscode-extension/README.md) for detailed setup and troubleshooting.

### Using the Library

```bash
npm install @boolesai/tspec
```

```javascript
import { parseTestCases, scheduler } from '@boolesai/tspec';

// Parse test cases from a .tcase file
const testCases = parseTestCases('./tests/login.http.tcase', {
  params: { username: 'testuser' },
  env: { API_HOST: 'api.example.com' }
});

// Execute tests with concurrency
const result = await scheduler.schedule(testCases, { concurrency: 5 });

console.log(result.summary); // { total: 4, passed: 4, failed: 0, passRate: 100 }
```

## Example TSpec File

```yaml
version: "1.0"
description: "Verify successful login with valid credentials"

metadata:
  prompt: |
    Test that a user with valid credentials can successfully login
    and receive a JWT token in the response.
  related_code:
    - "src/controllers/auth.controller.js"
    - "src/services/auth.service.js"
  test_category: "functional"
  risk_level: "high"
  tags: ["auth", "login", "smoke"]
  priority: "high"
  timeout: "10s"

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
  - type: "json_path"
    expression: "$.status"
    operator: "equals"
    expected: 200
  - type: "json_path"
    expression: "$.body.data.token"
    operator: "exists"
  - type: "response_time"
    max_ms: 1000

extract:
  token: "$.data.token"
  user_id: "$.data.user.id"
```

## File Extensions

TSpec uses protocol-specific file extensions:

| Extension | Protocol | Plugin |
|-----------|----------|--------|
| `.http.tcase` | HTTP/HTTPS | `@tspec/http` |
| `.web.tcase` | Web UI | `@tspec/web` |
| `.grpc.tcase` | gRPC | (reserved) |
| `.graphql.tcase` | GraphQL | (reserved) |
| `.ws.tcase` | WebSocket | (reserved) |

Custom plugins can register additional file extensions. See [plugins/README.md](./plugins/README.md) for details.

## Documentation

For complete documentation, see the [docs](./docs) directory:

- [Introduction](./docs/01-introduction.md) - Overview and design goals
- [Quick Start](./docs/02-quick-start.md) - Get started with TSpec
- [File Specification](./docs/03-file-specification.md) - File naming and structure
- [Core Structure](./docs/04-core-structure.md) - Understanding the TSpec format
- [Field Reference](./docs/05-field-reference.md) - Complete field documentation
- [Variables and Expressions](./docs/06-variables-expressions.md) - Variable system
- [Data-Driven Testing](./docs/07-data-driven-testing.md) - Parameterized tests
- [Assertions](./docs/08-assertions.md) - Validation and assertion types
- [Template Inheritance](./docs/09-template-inheritance.md) - Reuse test configurations
- [Protocol Reference](./docs/10-protocol-reference.md) - HTTP, gRPC protocol details
- [API Reference](./docs/11-api-reference.md) - Parser API documentation
- [Examples](./docs/12-examples.md) - Real-world examples

## Why TSpec?

### For AI Systems
- Structured metadata with `prompt` for context
- Clear, unambiguous field definitions
- Predictable structure optimized for LLM generation

### For Developers
- Template inheritance reduces duplication
- Data-driven testing for comprehensive coverage
- Version control friendly (YAML format)
- Co-locate tests with source code
- Unified structure across protocols

## Development

### Build from Source

Prerequisites:
- Node.js >= 18.0.0
- npm >= 9.0.0

```bash
# Clone the repository
git clone https://github.com/boolesai/testing-spec.git
cd testing-spec

# Build core package
cd core
npm install
npm run build
# Or with type generation
npm run package

# Build CLI package
cd ../cli
npm install
npm run build
# Or create a tarball for installation
npm run package

# Link for local development
cd ../core
npm link
cd ../cli
npm link @boolesai/tspec
npm link
```

After building, you can install the CLI globally from the local build:

```bash
cd cli
npm install -g .
```

## License

MIT

## Contributing

Contributions are welcome! Please check the [documentation](./docs) for details on the DSL structure and design principles.
