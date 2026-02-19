# tspec parse

Parse and display TSpec test case and suite information without executing any requests. This command resolves variables, expands templates, and shows the final test configuration. Use it for debugging variable substitution, understanding template inheritance, inspecting request payloads, and exploring suite structure before actual execution.

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
  "files": ["tests/login.http.tcase"],
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
| `--config <path>` | Path to tspec.config.json |
| `--no-proxy` | Disable proxy for this execution |
| `--proxy-url <url>` | Override proxy URL for this execution |

### CLI Examples

```bash
# Parse and display test cases
tspec parse tests/login.http.tcase

# Parse suite file
tspec parse tests/api.http.tsuite

# JSON output for inspection
tspec parse tests/*.tcase --output json

# With variable substitution
tspec parse tests/*.tcase -e API_HOST=localhost

# Verbose output for debugging
tspec parse tests/login.http.tcase -v

# Parse with parameters
tspec parse tests/*.tcase -p username=testuser -p timeout=5000
```

## Common Use Cases

### Debug Variable Substitution

See how variables are resolved:
```bash
tspec parse tests/login.http.tcase -e API_HOST=localhost -v
```

### Inspect Request Before Execution

View the final request that would be sent:
```bash
tspec parse tests/create_user.http.tcase --output json
```

### Understand Template Inheritance

See how extended templates merge:
```bash
tspec parse tests/auth_flow.http.tcase -v
```

### Verify Data-Driven Test Expansion

Check parameterized test variations:
```bash
tspec parse tests/login_data_driven.http.tcase
```

### Check Environment Resolution

Verify environment variable handling:
```bash
tspec parse tests/*.tcase -e API_HOST=staging.example.com
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

## Proxy Execution

Parsing can be performed on a remote proxy server by configuring proxy settings in `tspec.config.json`. See [Proxy Execution](../SKILL.md#proxy-execution) for configuration details.

```bash
# Parse through a specific proxy server
tspec parse tests/*.tcase --proxy-url http://localhost:8080

# Disable proxy and parse locally
tspec parse tests/*.tcase --no-proxy
```
