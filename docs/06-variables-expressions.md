# 6. Variables and Expressions

TSpec provides a powerful variable system for dynamic test case generation.

## Variable Reference Syntax

| Syntax | Description | Example |
|--------|-------------|---------|
| `${name}` | Simple variable | `${username}` |
| `${env.NAME}` | Environment variable | `${env.API_KEY}` |
| `${extract.key}` | Extracted value | `${extract.token}` |
| `${function()}` | Built-in function | `${timestamp}` |
| `${VAR\|default}` | Default value | `${HOST\|localhost}` |

## Variable Resolution Priority

Variables are resolved in the following order (highest priority first):

1. **Command line parameters** - Passed via `params` option
2. **System environment variables** - `process.env`
3. **Case-level `variables`** - Defined in the test file
4. **Template variables** - Inherited from templates

```javascript
// params has highest priority
const testCases = generateTestCases('./test.http.tcase', {
  params: { username: 'override_user' },  // Highest priority
  env: { API_HOST: 'custom.api.com' }     // Second priority
});
```

## Default Values

Use the pipe `|` syntax to provide fallback values:

```yaml
environment:
  host: "${API_HOST|api.example.com}"    # Uses API_HOST or falls back to api.example.com
  port: "${API_PORT|443}"                # Uses API_PORT or falls back to 443
  
variables:
  timeout: "${TIMEOUT|30}"               # Uses TIMEOUT or falls back to 30
```

## Built-in Functions

### `timestamp`

Returns current Unix timestamp in milliseconds.

```yaml
variables:
  ts: "${timestamp}"
  
http:
  headers:
    X-Request-Time: "${timestamp}"
```

**Output**: `1705500000000`

### `uuid`

Generates a UUID v4.

```yaml
variables:
  request_id: "${uuid}"
  
http:
  headers:
    X-Request-ID: "${request_id}"
```

**Output**: `550e8400-e29b-41d4-a716-446655440000`

### `random_int(min, max)`

Generates a random integer between min and max (inclusive).

```yaml
variables:
  random_amount: "${random_int(100, 1000)}"
  
http:
  body:
    json:
      amount: "${random_amount}"
```

**Output**: Random number like `547`

### `now(format)`

Returns current date/time formatted according to pattern.

```yaml
variables:
  date: "${now(yyyy-MM-dd)}"
  datetime: "${now(yyyy-MM-dd HH:mm:ss)}"
  
http:
  body:
    json:
      created_at: "${datetime}"
```

**Format tokens**:

| Token | Description | Example |
|-------|-------------|---------|
| `yyyy` | 4-digit year | 2024 |
| `MM` | 2-digit month | 01-12 |
| `dd` | 2-digit day | 01-31 |
| `HH` | 2-digit hour (24h) | 00-23 |
| `mm` | 2-digit minute | 00-59 |
| `ss` | 2-digit second | 00-59 |
| `SSS` | 3-digit millisecond | 000-999 |

**Output**: `2024-01-17` or `2024-01-17 15:30:45`

## Environment Variables

Reference system environment variables using the `env.` prefix:

```yaml
variables:
  api_key: "${env.API_KEY}"
  
http:
  headers:
    Authorization: "Bearer ${env.AUTH_TOKEN}"
  body:
    json:
      password: "${env.TEST_PASSWORD}"
```

## Extracted Variables

Reference values extracted from previous responses using the `extract.` prefix:

```yaml
# First test case extracts token
extract:
  token: "$.data.token"
  user_id: "$.data.user.id"

# Later in chain or in subsequent tests
http:
  headers:
    Authorization: "Bearer ${extract.token}"
  path: "/api/users/${extract.user_id}"
```

## Variable Scope

### File Scope

Variables defined in `variables` block are scoped to the current file:

```yaml
variables:
  local_var: "value"  # Only available in this file
```

### Environment Scope

Variables defined in `environment.variables` are available file-wide:

```yaml
environment:
  variables:
    base_path: "/v1"
    max_retry: 3
```

### Extracted Scope

Extracted variables persist for the test execution and can be passed to subsequent tests:

```javascript
// Run first test
const result1 = assertResults(response1, testCase1);

// Use extracted values in next test
const testCases2 = generateTestCases('./next.http.tcase', {
  extracted: result1.extracted  // { token: '...', user_id: '...' }
});
```

## Variable in Different Contexts

### In Strings

Variables are interpolated within strings:

```yaml
http:
  path: "/api/users/${user_id}/orders"
  headers:
    X-Custom: "prefix_${timestamp}_suffix"
```

### In Objects

Variables work within object values:

```yaml
http:
  body:
    json:
      username: "${username}"
      metadata:
        request_id: "${uuid}"
        timestamp: "${timestamp}"
```

### In Arrays

Variables work within array elements:

```yaml
metadata:
  tags: ["${env.ENV_NAME}", "smoke", "${test_type}"]
```

## Examples

### Complete Variable Usage

```yaml
version: "1.0"
description: "Complete variable usage example"

metadata:
  prompt: "Test with various variable types"
  related_code: ["src/api.js"]
  test_category: "functional"
  risk_level: "medium"
  tags: ["example"]
  priority: "medium"
  timeout: "10s"

environment:
  host: "${API_HOST|localhost:3000}"
  scheme: "${SCHEME|http}"
  variables:
    api_version: "v1"

variables:
  user_id: "U${random_int(1000, 9999)}"
  request_time: "${timestamp}"
  unique_email: "test_${timestamp}@example.com"

http:
  method: "POST"
  path: "/${api_version}/users"
  headers:
    Content-Type: "application/json"
    X-Request-ID: "${uuid}"
    X-Request-Time: "${request_time}"
    Authorization: "Bearer ${env.AUTH_TOKEN}"
  body:
    json:
      user_id: "${user_id}"
      email: "${unique_email}"
      created_at: "${now(yyyy-MM-dd HH:mm:ss)}"

assertions:
  - type: "json_path"
    expression: "$.status"
    operator: "equals"
    expected: 201
```
