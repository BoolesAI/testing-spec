---
name: tspec-run
description: Execute TSpec test cases and report results. Use for running API tests, checking endpoint functionality, and verifying test assertions. Supports HTTP and gRPC protocols with concurrent execution, environment variables, and multiple output formats. Keywords: run tests, execute tspec, test api, run http tests, run grpc tests, smoke test, regression test
---

# TSpec Run

## Overview

Execute TSpec test cases against API endpoints and report results. This skill runs `.tspec` test files, validates responses against assertions, and provides detailed pass/fail reporting in text or JSON format.

## MCP Tool Integration

### Tool Name: `tspec_run`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `files` | `string[]` | Yes | Files or glob patterns to run (e.g., `["tests/*.tspec"]`) |
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

### CI/CD Integration

```bash
tspec run tests/*.tspec --output json > results.json
```

### Run with Custom Host

```bash
tspec run tests/*.tspec -e API_HOST=staging.example.com
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
