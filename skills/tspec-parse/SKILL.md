---
name: tspec-parse
description: Parse and display test case and suite information without executing tests. Use for exploring test structure, debugging variable substitution, understanding template inheritance, and inspecting request payloads. Keywords: parse tspec, inspect test, explore tspec, debug variables, view test structure, template inheritance, dry run, parse suite, tsuite
---

# TSpec Parse

## Overview

Parse and display TSpec test case and suite information without executing any requests. This skill resolves variables, expands templates, and shows the final test configuration. Use it for debugging variable substitution, understanding template inheritance, inspecting request payloads, and exploring suite structure before actual execution.

## MCP Tool Integration

### Tool Name: `tspec_parse`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `files` | `string[]` | Yes | Files or glob patterns to parse |
| `env` | `object` | No | Environment variables as key-value pairs |
| `params` | `object` | No | Parameters as key-value pairs |
| `verbose` | `boolean` | No | Show detailed information |
| `output` | `string` | No | Output format: `json` or `text` (default: `text`) |

### Example MCP Call

```json
{
  "files": ["tests/login.http.tspec"],
  "env": { "API_HOST": "localhost" },
  "params": { "username": "testuser" },
  "verbose": true,
  "output": "text"
}
```

### Return Format

Returns parsed test information with:
- Test description and metadata
- Resolved environment and variables
- Final request configuration (URL, headers, body)
- Assertion definitions
- `isError: true` if parsing fails

## CLI Command Reference

### Usage

```bash
tspec parse <files...> [options]
```

### Options

| Option | Description |
|--------|-------------|
| `-o, --output <format>` | Output format: `json`, `text` (default: `text`) |
| `-v, --verbose` | Show detailed information |
| `-q, --quiet` | Minimal output |
| `-e, --env <key=value>` | Environment variables (repeatable) |
| `-p, --params <key=value>` | Parameters (repeatable) |

### CLI Examples

```bash
# Parse and display test cases
tspec parse tests/login.http.tspec

# Parse suite file
tspec parse tests/api.http.tsuite

# JSON output for inspection
tspec parse tests/*.tspec --output json

# With variable substitution
tspec parse tests/*.tspec -e API_HOST=localhost

# Verbose output for debugging
tspec parse tests/login.http.tspec -v

# Parse with parameters
tspec parse tests/*.tspec -p username=testuser -p timeout=5000
```

## Common Use Cases

### Debug Variable Substitution

See how variables are resolved:
```bash
tspec parse tests/login.http.tspec -e API_HOST=localhost -v
```

### Inspect Request Before Execution

View the final request that would be sent:
```bash
tspec parse tests/create_user.http.tspec --output json
```

### Understand Template Inheritance

See how extended templates merge:
```bash
tspec parse tests/auth_flow.http.tspec -v
```

### Verify Data-Driven Test Expansion

Check parameterized test variations:
```bash
tspec parse tests/login_data_driven.http.tspec
```

### Check Environment Resolution

Verify environment variable handling:
```bash
tspec parse tests/*.tspec -e API_HOST=staging.example.com
```

## When to Use Parse vs Run

| Scenario | Use Parse | Use Run |
|----------|-----------|---------|
| Debug variable issues | ✓ | |
| Inspect request payload | ✓ | |
| Understand test structure | ✓ | |
| Verify template inheritance | ✓ | |
| Actually test the API | | ✓ |
| Get pass/fail results | | ✓ |
| CI/CD testing | | ✓ |

## Exit Codes

| Code | Description |
|------|-------------|
| `0` | Parse successful |
| `1` | Parse errors (invalid syntax, unresolved variables) |
| `2` | Error (file not found) |

## Related Skills

- [tspec-run](../tspec-run/SKILL.md) - Execute parsed tests
- [tspec-validate](../tspec-validate/SKILL.md) - Validate before parsing
- [tspec-list](../tspec-list/SKILL.md) - List supported protocols
