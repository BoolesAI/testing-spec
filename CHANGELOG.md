# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-25

### Added

#### @boolesai/tspec (Core Library)

- **Parser Module**: Parse and validate `.tspec` test specification files
  - `validateTestCase()` - Validate a `.tspec` file for schema correctness
  - `parseTestCases()` - Parse file into executable test cases
  - `parseTestCasesFromString()` - Parse YAML string content
- **Runner Module**: Execute test cases with HTTP protocol support
  - `executeTestCase()` - Execute a single test case
  - `createRunner()` - Create a protocol-specific runner
  - Protocol executor registry for extensibility
- **Assertion Module**: Rich assertion engine with multiple validation types
  - `runAssertions()` - Run all assertions against a response
  - `runAssertion()` - Run a single assertion
  - `extractVariables()` - Extract variables from response
  - `getAssertionSummary()` - Get summary of assertion results
  - Supported assertion types: `status_code`, `json_path`, `header`, `response_time`, `javascript`
- **Scheduler Module**: Concurrent test execution with configurable parallelism
  - `scheduler.schedule()` - Execute tests with concurrency
  - `scheduler.scheduleByType()` - Execute tests grouped by protocol
- Modular exports supporting both unified and subpath imports

#### @boolesai/tspec-cli (Command Line Interface)

- **Commands**:
  - `tspec validate` - Validate `.tspec` files for schema correctness
  - `tspec run` - Execute test cases with configurable concurrency, environment variables, and parameters
  - `tspec parse` - Parse and display test case information without execution
  - `tspec list` - List supported protocols and configuration
  - `tspec mcp` - Start MCP server for AI tool integration
- **Output Formats**: JSON and text output for CI/CD integration
- **MCP Integration**: Model Context Protocol server exposing TSpec commands as tools
  - `tspec_run`, `tspec_validate`, `tspec_parse`, `tspec_list` tools
  - Claude Desktop configuration support
- **CI/CD Support**: GitHub Actions and GitLab CI integration examples

#### vscode-tspec (VS Code Extension)

- **Syntax Highlighting**: Rich syntax highlighting for `.tspec` files
- **Code Snippets**: Pre-built templates for common test patterns
  - `tspec-http`, `tspec-post`, `tspec-get`, `tspec-assertion`, `tspec-data`
- **Validation**: Real-time validation with error diagnostics
- **Auto-completion**: IntelliSense support for TSpec fields and values
- **Language Configuration**: Smart bracket matching, auto-indentation, and comment toggling
- **Test Runner Integration**:
  - VS Code Test Explorer integration
  - CodeLens for in-editor test execution
  - Automatic test discovery and file watching
  - Configurable concurrency, timeout, and environment variables
- **Configuration Settings**:
  - Validation: `tspec.validation.enabled`, `tspec.validation.strictMode`
  - Testing: `tspec.testing.enabled`, `tspec.testing.cliPath`, `tspec.testing.concurrency`, `tspec.testing.defaultTimeout`, `tspec.testing.watchMode`, `tspec.testing.envVars`

#### Skills (MCP Integration)

- **tspec-list**: List supported protocols and TSpec configuration
- **tspec-parse**: Parse and display test case information without execution
- **tspec-validate**: Validate `.tspec` files for schema correctness
- **tspec-run**: Execute TSpec test cases and report results

#### Demo (Bookstore API)

- Demonstration bookstore management API for TSpec testing showcase
- RESTful CRUD operations: GET, POST, PUT, DELETE
- Pagination and sorting support
- Comprehensive TSpec test cases:
  - Positive tests: list, get, create, update, delete operations
  - Negative tests: 404 not found, 400 validation errors
- Tech stack: Koa.js, SQLite, Prisma ORM

#### TSpec DSL Features

- YAML-based domain-specific language for API testing
- Multi-protocol support: HTTP/HTTPS (gRPC, GraphQL, WebSocket planned)
- Template inheritance for test configuration reuse
- Data-driven testing with parameterized test cases
- Variable system with built-in functions and dynamic substitution
- Comprehensive metadata support for AI-assisted test generation
- Lifecycle hooks for setup and teardown
- Protocol-specific file extensions: `.http.tspec`, `.grpc.tspec`, `.graphql.tspec`, `.ws.tspec`

#### Documentation

- Complete TSpec DSL documentation
- Quick start guides for CLI, VSCode extension, and library usage
- API reference documentation
- Real-world examples and tutorials
