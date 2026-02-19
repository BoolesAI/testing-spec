# tspec run

Execute TSpec test cases and suites against API endpoints and report results. This command runs `.tcase` test files and `.tsuite` suite files, validates responses against assertions, and provides detailed pass/fail reporting in text or JSON format. Suites support lifecycle hooks (setup/teardown/before_each/after_each) with proper execution order.

## MCP Tool Integration

### Tool Name: `tspec_run`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `files` | `string[]` | Yes | Files or glob patterns to run (`.tcase` or `.tsuite`) |
| `concurrency` | `number` | No | Max concurrent tests (default: 5) |
| `env` | `object` | No | Environment variables as key-value pairs |
| `params` | `object` | No | Parameters as key-value pairs |
| `failFast` | `boolean` | No | Stop on first failure |
| `output` | `string` | No | Output format: `json` or `text` (default: `text`) |

### Example MCP Call

```json
{
  "files": ["tests/*.http.tcase"],
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
| `--config <path>` | Path to tspec.config.json |
| `--no-proxy` | Disable proxy for this execution |
| `--proxy-url <url>` | Override proxy URL for this execution |

### CLI Examples

```bash
# Run all HTTP tests
tspec run tests/*.http.tcase

# Run with environment variables
tspec run tests/*.tcase -e API_HOST=api.example.com -e API_KEY=secret

# Run with parameters
tspec run tests/*.tcase -p username=testuser -p timeout=5000

# Run with higher concurrency
tspec run tests/*.tcase -c 10

# Verbose output for debugging
tspec run tests/*.tcase -v

# JSON output for CI/CD
tspec run tests/*.tcase --output json

# Stop on first failure
tspec run tests/*.tcase --fail-fast
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
    - file: "create_user.http.tcase"
    - files: "users/*.http.tcase"
```

## Common Use Cases

### Run All Tests in Directory

```bash
tspec run "tests/**/*.tcase"
```

### Run Specific Test File

```bash
tspec run tests/login_success.http.tcase
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
tspec run tests/*.tcase --output json > results.json
```

### Run with Custom Host

```bash
tspec run tests/*.tcase -e API_HOST=staging.example.com
```

## Exit Codes

| Code | Description |
|------|-------------|
| `0` | All tests passed |
| `1` | One or more tests failed |
| `2` | Error (invalid input/configuration) |

## Proxy Execution

Tests can be executed on a remote proxy server by configuring proxy settings in `tspec.config.json`. See [Proxy Execution](../SKILL.md#proxy-execution) for configuration details.

```bash
# Run tests through a specific proxy server
tspec run tests/*.tcase --proxy-url http://localhost:8080

# Disable proxy and run locally
tspec run tests/*.tcase --no-proxy
```

When proxy is configured, tests are automatically forwarded to the remote server. The output includes a `[Proxy: <url>]` indicator.
