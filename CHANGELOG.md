# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-01-31

### Added

#### @boolesai/tspec (Core Library)

- **Lifecycle Module**: New lifecycle management system for test execution hooks
  - `executeLifecycleActions()` - Execute actions filtered by scope (before_test, after_test, before_all, after_all)
  - Support for script, extract, and output actions
  - Context-aware execution with access to variables, extracted variables, and response data
- **Related Code Support**: Associate test cases with source code references
  - `related_code` field in test specifications for linking to implementation code
  - Line reference support for precise code location tracking
  - Parse and validate related code references
- **Enhanced Assertion Engine**:
  - **New Primary Assertion Types**: Unified response access through `json_path`, `string`, `number`, `regex` types
  - **XML Path Support**: `xml_path` assertion type for XML response validation with XPath expressions
  - **File Assertions**: New `file_exist` and `file_read` types for filesystem validation
  - **Exception Handling**: `exception` assertion type for validating error conditions
  - **Response Time**: `response_time` assertion for performance validation
  - Improved extractor functions with comprehensive variable extraction from responses
- **Dependencies**: Added `@xmldom/xmldom` (^0.8.11) and `xpath` (^0.0.34) for XML processing

#### @boolesai/tspec-cli (Command Line Interface)

- Enhanced test result formatting with improved readability
- Updated to use @boolesai/tspec version 1.1.0
- Better error reporting and test execution summaries

#### vscode-tspec (VS Code Extension)

- Updated code snippets with new assertion types and lifecycle actions
- Enhanced syntax highlighting for new fields (`related_code`, lifecycle actions)
- Improved validation and diagnostics for new assertion types
- Enhanced IntelliSense support for lifecycle hooks and new assertion operators

#### Skills (MCP Integration)

- **tspec-gen**: New skill for AI-assisted test case generation from API specifications
  - Generate comprehensive test cases from OpenAPI/Swagger specs
  - Intelligent test scenario generation (positive, negative, edge cases)
  - Support for data-driven test generation
- **tspec-coverage**: New skill for test coverage analysis
  - Analyze test coverage across API endpoints
  - Identify untested scenarios and missing test cases
  - Generate coverage reports

#### Documentation

- Updated **Core Structure** (04-core-structure.md) with lifecycle module documentation
- Enhanced **Field Reference** (05-field-reference.md) with `related_code` field specifications
- Comprehensive **Assertions** (08-assertions.md) update:
  - Detailed documentation for all new assertion types
  - Examples for `xml_path`, `file_exist`, `file_read`, and `exception` assertions
  - Migration guide from deprecated assertion types
- Updated **Examples** (12-examples.md) with real-world usage of new features
- Enhanced **Template Inheritance** (09-template-inheritance.md) examples
- Updated **Quick Start** (02-quick-start.md) with latest syntax

### Changed

- **Breaking**: Refactored assertion types for consistency
  - Deprecated separate envelope-specific assertion types
  - Migrated to unified access through primary types with JSONPath
  - `status_code`, `header`, `body_json`, `body_text` assertions now use `json_path` with `$.status`, `$.headers.*`, `$.body.*` patterns
- Improved test case parsing with better error messages
- Enhanced variable extraction with more robust error handling
- Updated all demo test cases to use new assertion syntax
- Enhanced schema validation for new fields and assertion types

### Fixed

- Improved assertion error messages for better debugging
- Better handling of edge cases in variable extraction
- More robust XML parsing with proper namespace support
- Fixed validation issues with complex nested assertions

## [1.0.0] - 2026-01-25

### Added

#### @boolesai/tspec (Core Library)

- **Parser Module**: Parse and validate `.tcase` test specification files
  - `validateTestCase()` - Validate a `.tcase` file for schema correctness
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
  - Supported assertion types: `json_path`, `string`, `number`, `regex`, `xml_path`, `response_time`, `javascript`, `file_exist`, `file_read`, `exception`
- **Scheduler Module**: Concurrent test execution with configurable parallelism
  - `scheduler.schedule()` - Execute tests with concurrency
  - `scheduler.scheduleByType()` - Execute tests grouped by protocol
- Modular exports supporting both unified and subpath imports

#### @boolesai/tspec-cli (Command Line Interface)

- **Commands**:
  - `tspec validate` - Validate `.tcase` files for schema correctness
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

- **Syntax Highlighting**: Rich syntax highlighting for `.tcase` files
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
- **tspec-validate**: Validate `.tcase` files for schema correctness
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
- Protocol-specific file extensions: `.http.tcase`, `.grpc.tcase`, `.graphql.tcase`, `.ws.tcase`

#### Documentation

- Complete TSpec DSL documentation
- Quick start guides for CLI, VSCode extension, and library usage
- API reference documentation
- Real-world examples and tutorials
