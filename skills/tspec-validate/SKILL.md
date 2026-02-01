---
name: tspec-validate
description: Validate .tspec and .tsuite files for schema correctness without executing tests. Use for syntax checking, pre-commit validation, and CI/CD linting. Validates YAML structure, required fields, protocol blocks, assertion formats, and suite structures. Keywords: validate tspec, check syntax, lint tspec, verify schema, tspec errors, pre-commit, schema validation, validate tsuite, suite validation
---

# TSpec Validate

## Overview

Validate `.tspec` and `.tsuite` files for schema correctness without executing any tests. This skill checks YAML syntax, required fields, protocol block structure, assertion formats, and suite configuration. Use it for pre-commit hooks, CI/CD validation stages, and catching errors before test execution.

## MCP Tool Integration

### Tool Name: `tspec_validate`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `files` | `string[]` | Yes | Files or glob patterns to validate (`.tspec` or `.tsuite`) |
| `output` | `string` | No | Output format: `json` or `text` (default: `text`) |

### Example MCP Call

```json
{
  "files": ["tests/*.tspec"],
  "output": "text"
}
```

### Validate Suite Files

```json
{
  "files": ["tests/*.tsuite"],
  "output": "text"
}
```

### Return Format

Returns validation results with:
- List of valid files
- List of files with errors
- Detailed error messages with line numbers
- `isError: true` if any validation errors found

## CLI Command Reference

### Usage

```bash
tspec validate <files...> [options]
```

### Options

| Option | Description |
|--------|-------------|
| `-o, --output <format>` | Output format: `json`, `text` (default: `text`) |
| `-q, --quiet` | Only output errors |

### CLI Examples

```bash
# Validate a single file
tspec validate tests/login.http.tspec

# Validate multiple files with glob pattern
tspec validate "tests/**/*.tspec"

# Validate suite files
tspec validate "tests/**/*.tsuite"

# Validate all test and suite files
tspec validate "tests/**/*.tspec" "tests/**/*.tsuite"

# JSON output for CI/CD
tspec validate tests/*.tspec --output json

# Quiet mode - only show errors
tspec validate tests/*.tspec -q
```

## Common Use Cases

### Validate All Test Files

```bash
tspec validate "tests/**/*.tspec"
```

### Pre-commit Hook Validation

```bash
tspec validate $(git diff --cached --name-only --diff-filter=ACM | grep '.tspec$')
```

### CI/CD Validation Stage

```bash
tspec validate tests/*.tspec --output json
```

### Validate Before Running Tests

```bash
tspec validate tests/*.tspec && tspec run tests/*.tspec
```

## What Gets Validated

### Structure Validation
- Valid YAML 1.2 syntax
- UTF-8 encoding
- Required top-level fields (`version`, `description`)

### Protocol Validation
- At least one protocol block (`http`, `grpc`, etc.)
- Required protocol fields (e.g., `method`, `path` for HTTP)
- Valid HTTP methods, status codes

### Assertion Validation
- Valid assertion types (`json_path`, `string`, `number`, `regex`, `xml_path`, `response_time`, `javascript`, `file_exist`, `file_read`, `exception`)
- Required assertion fields
- Valid comparison operators

### Metadata Validation
- Valid `test_category` values
- Valid `priority` values
- Valid `related_code` format with optional line references `[1,2-10]`

### Line Reference Validation
- Line numbers must be positive integers (1-based)
- Range end must be >= start
- Format: `path/file.ext[N]` or `path/file.ext[N-M]` or `path/file.ext[N,M-P,...]`

### Suite Validation (`.tsuite` files)
- Valid suite structure with `suite:` top-level key
- Required fields: `name`
- Valid test references with `file` or `files` (but not both)
- At least one test or nested suite reference
- Valid lifecycle action types: `script`, `http`, `grpc`, `extract`, `output`, `wait`, `log`
- Valid execution configuration fields

## Exit Codes

| Code | Description |
|------|-------------|
| `0` | All files valid |
| `1` | Validation errors found |
| `2` | Error (invalid input/file not found) |

## Related Skills

- [tspec-run](../tspec-run/SKILL.md) - Execute validated test files
- [tspec-parse](../tspec-parse/SKILL.md) - Inspect test structure after validation
- [tspec-list](../tspec-list/SKILL.md) - List supported protocols
