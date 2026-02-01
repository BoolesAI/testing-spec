---
name: tspec-run
description: Execute TSpec test cases and suites. Use for running API tests, checking endpoint functionality, and verifying test assertions. Supports HTTP and gRPC protocols, test suites with lifecycle hooks, concurrent execution, environment variables, and multiple output formats. Keywords: run tests, execute tspec, test api, run http tests, run grpc tests, smoke test, regression test, test suite, tsuite
---

# TSpec Run

## Overview

Execute TSpec test cases and suites against API endpoints and report results. This skill runs `.tspec` test files and `.tsuite` suite files, validates responses against assertions, and provides detailed pass/fail reporting in text or JSON format. Suites support lifecycle hooks (setup/teardown/before_each/after_each) with proper execution order.

## MCP Tool Integration

### Tool Name: `tspec_run`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `files` | `string[]` | Yes | Files or glob patterns to run (`.tspec` or `.tsuite`) |
| `concurrency` | `number` | No | Max concurrent tests (default: 5) |
| `env` | `object` | No | Environment variables as key-value pairs |
| `params` | `object` | No | Parameters as key-value pairs |
| `failFast` | `boolean` | No | Stop on first failure |
| `output` | `string` | No | Output format: `json` or `text` (default: `text`) |

### Example MCP Call

```json
{
  "files": ["tests/*.http.tspec"],
  "concurrency": 5,
  "env": { "API_HOST": "localhost", "API_PORT": "3000" },
  "params": { "timeout": "5000" },
  "failFast": false,
  "output": "text"
}
```

### Running a Suite

```json
{
  "files": ["tests/api.http.tsuite"],
  "env": { "API_HOST": "localhost:3000" },
  "output": "text"
}
```

### Return Format

Returns test execution results with:
- Summary of passed/failed/skipped tests
- Detailed assertion results per test
- Error messages for failures
- `isError: true` if any tests failed

## CLI Command Reference

### Usage

```bash
tspec run <files...> [options]
```

### Options

| Option | Description |
|--------|-------------|
| `-o, --output <format>` | Output format: `json`, `text` (default: `text`) |
| `-c, --concurrency <n>` | Max concurrent tests (default: `5`) |
| `-e, --env <key=value>` | Environment variables (repeatable) |
| `-p, --params <key=value>` | Parameters (repeatable) |
| `-v, --verbose` | Verbose output |
| `-q, --quiet` | Only output summary |
| `--fail-fast` | Stop on first failure |

### CLI Examples

```bash
# Run all HTTP tests
tspec run tests/*.http.tspec

# Run with environment variables
tspec run tests/*.tspec -e API_HOST=api.example.com -e API_KEY=secret

# Run with parameters
tspec run tests/*.tspec -p username=testuser -p timeout=5000

# Run with higher concurrency
tspec run tests/*.tspec -c 10

# Verbose output for debugging
tspec run tests/*.tspec -v

# JSON output for CI/CD
tspec run tests/*.tspec --output json

# Stop on first failure
tspec run tests/*.tspec --fail-fast
```

## Common Use Cases

### Run All Tests in Directory

```bash
tspec run "tests/**/*.tspec"
```

### Run Specific Test File

```bash
tspec run tests/login_success.http.tspec
```

### Run a Test Suite

```bash
tspec run tests/api.http.tsuite
```

### Run Multiple Suites

```bash
tspec run "tests/**/*.tsuite"
```

### CI/CD Integration

```bash
tspec run tests/*.tspec --output json > results.json
```

### Run with Custom Host

```bash
tspec run tests/*.tspec -e API_HOST=staging.example.com
```

## Test Suites

Test suites (`.tsuite` files) organize related tests with shared configuration and lifecycle hooks.

### Suite Lifecycle Execution Order

1. Suite `lifecycle.setup` runs once before all tests
2. For each test:
   - `before_each` hooks run
   - Test executes
   - `after_each` hooks run
3. Suite `lifecycle.teardown` runs once after all tests

### Example Suite

```yaml
suite:
  name: "API Tests"
  
  lifecycle:
    setup:
      - action: "log"
        message: "Starting test suite"
    teardown:
      - action: "log"
        message: "Completed test suite"
        
  before_each:
    - action: "http"
      request:
        method: "POST"
        path: "/auth/token"
        
  tests:
    - file: "create_user.http.tspec"
    - files: "users/*.http.tspec"
```

## Exit Codes

| Code | Description |
|------|-------------|
| `0` | All tests passed |
| `1` | One or more tests failed |
| `2` | Error (invalid input/configuration) |

## Related Skills

- [tspec-validate](../tspec-validate/SKILL.md) - Validate test files before running
- [tspec-parse](../tspec-parse/SKILL.md) - Inspect test structure without execution
- [tspec-list](../tspec-list/SKILL.md) - List supported protocols
