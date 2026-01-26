# 8. Assertions

Assertions define validation rules for test responses. TSpec provides built-in assertion types and supports custom JavaScript assertions.

## Migration Notice

TSpec v1.1 introduces a protocol-agnostic assertion model. The following assertion types are **deprecated** and will be removed in a future version:

| Deprecated Type | Migration |
|----------------|-----------|
| `status_code` | Use `json_path` with `expression: "$.status"` |
| `grpc_code` | Use `json_path` with `expression: "$.grpcCode"` |
| `header` | Use `json_path` with `expression: "$.header['Header-Name']"` |
| `proto_field` | Use `json_path` with `expression: "$.body.field.path"` |

See [Migration Examples](#migration-examples) for detailed guidance.

## Unified Response Structure

All response data is accessible via JSONPath expressions using a unified structure:

| Path | Description |
|------|-------------|
| `$.status` | HTTP status code or mapped gRPC numeric code |
| `$.grpcCode` | Original gRPC status string ("OK", "NOT_FOUND", etc.) |
| `$.header['Name']` | Response headers (case-insensitive) |
| `$.body` | Response body content |
| `$.body.*` | Nested body fields |
| `$.responseTime` | Response duration in milliseconds |

```yaml
assertions:
  # Check HTTP status
  - type: "json_path"
    expression: "$.status"
    operator: "equals"
    expected: 200

  # Check response header
  - type: "json_path"
    expression: "$.header['Content-Type']"
    operator: "contains"
    expected: "application/json"

  # Check response body field
  - type: "json_path"
    expression: "$.body.data.token"
    operator: "exists"
```

## Assertion Structure

```yaml
assertions:
  - type: "<assertion_type>"
    # type-specific fields...
    message: "Optional custom failure message"
```

## Built-in Assertion Types

### `json_path`

Validates response data using JSONPath expressions. This is the primary assertion type for protocol-agnostic validation.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `expression` | string | Yes | JSONPath expression |
| `operator` | string | Yes | Comparison operator |
| `expected` | any | Depends | Expected value (for `equals`, `contains`, etc.) |
| `pattern` | string | Depends | Regex pattern (for `matches`) |

```yaml
assertions:
  # Check value exists
  - type: "json_path"
    expression: "$.body.data.token"
    operator: "exists"

  # Check HTTP status code
  - type: "json_path"
    expression: "$.status"
    operator: "equals"
    expected: 200

  # Check response header
  - type: "json_path"
    expression: "$.header['Content-Type']"
    operator: "contains"
    expected: "application/json"

  # Check exact value
  - type: "json_path"
    expression: "$.body.data.status"
    operator: "equals"
    expected: "active"

  # Check regex pattern
  - type: "json_path"
    expression: "$.body.data.email"
    operator: "matches"
    pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"

  # Check contains
  - type: "json_path"
    expression: "$.body.message"
    operator: "contains"
    expected: "success"

  # Check not empty
  - type: "json_path"
    expression: "$.body.data.items"
    operator: "not_empty"

  # Check numeric comparison
  - type: "json_path"
    expression: "$.body.data.count"
    operator: "gt"
    expected: 0

  # Check array/string length
  - type: "json_path"
    expression: "$.body.data.items"
    operator: "length_gte"
    expected: 1

  # Check gRPC status code
  - type: "json_path"
    expression: "$.grpcCode"
    operator: "equals"
    expected: "OK"
```

#### JSONPath Expression Examples

| Expression | Description |
|------------|-------------|
| `$.status` | HTTP status code |
| `$.grpcCode` | gRPC status string |
| `$.header['Content-Type']` | Response header value |
| `$.body` | Full response body |
| `$.body.data` | Root-level `data` field in body |
| `$.body.data.user.name` | Nested field in body |
| `$.body.data.items[0]` | First array element |
| `$.body.data.items[*].id` | All `id` fields in array |
| `$.responseTime` | Response time in ms |

### `string`

Extracts a value and coerces it to string before comparison.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `expression` | string | Yes | JSONPath expression |
| `operator` | string | Yes | Comparison operator |
| `expected` | string | Depends | Expected string value |

```yaml
assertions:
  # Ensure numeric ID is treated as string
  - type: "string"
    expression: "$.body.data.id"
    operator: "equals"
    expected: "12345"

  # Check string starts with prefix
  - type: "string"
    expression: "$.body.data.code"
    operator: "matches"
    pattern: "^ERR_"
```

### `number`

Extracts a value and coerces it to number before comparison. Fails if the value cannot be converted to a number.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `expression` | string | Yes | JSONPath expression |
| `operator` | string | Yes | Comparison operator |
| `expected` | number | Depends | Expected numeric value |

```yaml
assertions:
  # Compare string as number
  - type: "number"
    expression: "$.body.data.price"
    operator: "gte"
    expected: 0

  # Check count is within range
  - type: "number"
    expression: "$.body.meta.total"
    operator: "lte"
    expected: 100
```

### `regex`

Extracts values using regex capture groups.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `expression` | string | Yes | JSONPath expression to extract source string |
| `pattern` | string | Yes | Regex pattern with capture groups |
| `extract_group` | integer | No | Capture group index (default: 0 = full match) |
| `operator` | string | No | Comparison operator (default: `exists`) |
| `expected` | any | Depends | Expected value for extracted group |

```yaml
assertions:
  # Extract and validate UUID from URL
  - type: "regex"
    expression: "$.header['Location']"
    pattern: "/users/([a-f0-9-]{36})"
    extract_group: 1
    operator: "exists"

  # Extract version number
  - type: "regex"
    expression: "$.body.version"
    pattern: "^v(\\d+)\\.(\\d+)\\.(\\d+)$"
    extract_group: 1
    operator: "gte"
    expected: "2"
```

### `xml_path`

Validates XML response using XPath expressions.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `expression` | string | Yes | XPath expression |
| `operator` | string | Yes | Comparison operator |
| `expected` | any | Depends | Expected value |

```yaml
assertions:
  # Check XML element exists
  - type: "xml_path"
    expression: "//user/name"
    operator: "exists"

  # Check XML attribute value
  - type: "xml_path"
    expression: "//response/@status"
    operator: "equals"
    expected: "success"

  # Check XML element content
  - type: "xml_path"
    expression: "//error/code/text()"
    operator: "equals"
    expected: "0"
```

### `response_time`

Validates response time is within limit.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `max_ms` | integer | Yes | Maximum allowed time in milliseconds |

```yaml
assertions:
  - type: "response_time"
    max_ms: 1000

  - type: "response_time"
    max_ms: 500
    message: "Login should complete within 500ms"
```

### `javascript`

Custom JavaScript assertion for complex validation.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `source` | string | Yes | JavaScript code returning boolean |

Available variables in scope:
- `response` - Full response object (includes `status`, `header`, `body`, `responseTime`, `grpcCode`)
- `body` - Parsed response body
- `headers` - Response headers
- `statusCode` - HTTP status code

```yaml
assertions:
  - type: "javascript"
    source: |
      return body.items.length > 0 && 
             body.items.every(item => item.price > 0);
    message: "All items should have positive prices"

  - type: "javascript"
    source: |
      const token = body.data.token;
      const parts = token.split('.');
      return parts.length === 3;  // JWT format
    message: "Token should be valid JWT format"
```

## Deprecated Assertion Types

The following assertion types are deprecated but remain functional for backward compatibility.

### `status_code` (DEPRECATED)

> **Migration**: Use `json_path` with `expression: "$.status"`

Validates HTTP status code.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `expected` | integer | Yes | Expected HTTP status code |

```yaml
# Deprecated
- type: "status_code"
  expected: 200

# Recommended
- type: "json_path"
  expression: "$.status"
  operator: "equals"
  expected: 200
```

### `grpc_code` (DEPRECATED)

> **Migration**: Use `json_path` with `expression: "$.grpcCode"`

Validates gRPC status code.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `expected` | string | Yes | Expected gRPC code |

**Common gRPC codes**: `OK`, `CANCELLED`, `UNKNOWN`, `INVALID_ARGUMENT`, `DEADLINE_EXCEEDED`, `NOT_FOUND`, `ALREADY_EXISTS`, `PERMISSION_DENIED`, `UNAUTHENTICATED`

```yaml
# Deprecated
- type: "grpc_code"
  expected: "OK"

# Recommended
- type: "json_path"
  expression: "$.grpcCode"
  operator: "equals"
  expected: "OK"
```

### `header` (DEPRECATED)

> **Migration**: Use `json_path` with `expression: "$.header['Header-Name']"`

Validates HTTP response headers.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Header name (case-insensitive) |
| `operator` | string | Yes | Comparison operator |
| `value` | string | Depends | Expected value |

```yaml
# Deprecated
- type: "header"
  name: "Content-Type"
  operator: "contains"
  value: "application/json"

# Recommended
- type: "json_path"
  expression: "$.header['Content-Type']"
  operator: "contains"
  expected: "application/json"
```

### `proto_field` (DEPRECATED)

> **Migration**: Use `json_path` with `expression: "$.body.field.path"`

Validates Protobuf response fields (for gRPC).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | string | Yes | Dot-notation field path |
| `operator` | string | Yes | Comparison operator |
| `expected` | any | Depends | Expected value |

```yaml
# Deprecated
- type: "proto_field"
  path: "user.name"
  operator: "not_empty"

# Recommended
- type: "json_path"
  expression: "$.body.user.name"
  operator: "not_empty"
```

## Comparison Operators

| Operator | Description | Example Use |
|----------|-------------|-------------|
| `equals` / `eq` | Exact match | `expected: 200` |
| `not_equals` / `neq` | Not equal | `expected: "error"` |
| `exists` | Value is not null/undefined | - |
| `not_exists` | Value is null/undefined | - |
| `not_empty` | String/array has length > 0 | - |
| `contains` | String/array contains value | `expected: "success"` |
| `not_contains` | Does not contain | `expected: "error"` |
| `matches` | Regex pattern match | `pattern: "^[A-Z]+$"` |
| `gt` | Greater than | `expected: 0` |
| `gte` | Greater than or equal | `expected: 1` |
| `lt` | Less than | `expected: 100` |
| `lte` | Less than or equal | `expected: 99` |
| `type` | Type check | `expected: "string"` |
| `length` | Array/string length equals | `expected: 5` |
| `length_gt` | Array/string length greater than | `expected: 0` |
| `length_gte` | Array/string length greater than or equal | `expected: 1` |
| `length_lt` | Array/string length less than | `expected: 100` |
| `length_lte` | Array/string length less than or equal | `expected: 10` |

## Assertion Include (Reuse)

Reference assertions from external library files:

```yaml
assertions:
  - include: "assertions/common.yaml#common.success_status"
  - include: "assertions/auth.yaml#auth.valid_token"
```

### Assertion Library Format

**assertions/common.yaml**:
```yaml
definitions:
  - id: "common.success_status"
    type: "json_path"
    expression: "$.status"
    operator: "equals"
    expected: 200

  - id: "common.json_content_type"
    type: "json_path"
    expression: "$.header['Content-Type']"
    operator: "contains"
    expected: "application/json"

  - id: "common.fast_response"
    type: "response_time"
    max_ms: 1000
```

## Assertion Results

The `assertResults` function returns:

```javascript
{
  testCaseId: "login_success",
  passed: true,                    // Overall pass/fail
  assertions: [
    {
      passed: true,
      type: "json_path",
      expression: "$.status",
      operator: "equals",
      expected: 200,
      actual: 200,
      message: "JSONPath $.status equals assertion passed"
    },
    {
      passed: true,
      type: "json_path",
      expression: "$.body.data.token",
      operator: "exists",
      actual: "eyJhbGc...",
      message: "JSONPath $.body.data.token exists assertion passed"
    },
    {
      passed: true,
      type: "status_code",           // Deprecated type
      expected: 200,
      actual: 200,
      message: "Status code is 200",
      deprecated: true,
      migrationHint: "Use json_path with expression \"$.status\" instead"
    }
  ],
  summary: {
    total: 3,
    passed: 3,
    failed: 0,
    passRate: 100
  },
  extracted: {
    token: "eyJhbGc..."
  }
}
```

## Migration Examples

### HTTP Status Code

```yaml
# Before (deprecated)
assertions:
  - type: "status_code"
    expected: 200

# After (recommended)
assertions:
  - type: "json_path"
    expression: "$.status"
    operator: "equals"
    expected: 200
```

### HTTP Header

```yaml
# Before (deprecated)
assertions:
  - type: "header"
    name: "Content-Type"
    operator: "contains"
    value: "application/json"

# After (recommended)
assertions:
  - type: "json_path"
    expression: "$.header['Content-Type']"
    operator: "contains"
    expected: "application/json"
```

### gRPC Code

```yaml
# Before (deprecated)
assertions:
  - type: "grpc_code"
    expected: "OK"

# After (recommended)
assertions:
  - type: "json_path"
    expression: "$.grpcCode"
    operator: "equals"
    expected: "OK"
```

### Proto Field

```yaml
# Before (deprecated)
assertions:
  - type: "proto_field"
    path: "user.name"
    operator: "not_empty"

# After (recommended)
assertions:
  - type: "json_path"
    expression: "$.body.user.name"
    operator: "not_empty"
```

## Best Practices

### Order Assertions Logically

```yaml
assertions:
  # 1. Status code first (fail fast)
  - type: "json_path"
    expression: "$.status"
    operator: "equals"
    expected: 200
    
  # 2. Response time
  - type: "response_time"
    max_ms: 1000
    
  # 3. Headers
  - type: "json_path"
    expression: "$.header['Content-Type']"
    operator: "contains"
    expected: "application/json"
    
  # 4. Body structure
  - type: "json_path"
    expression: "$.body.data"
    operator: "exists"
    
  # 5. Specific values
  - type: "json_path"
    expression: "$.body.data.status"
    operator: "equals"
    expected: "active"
```

### Use Meaningful Messages

```yaml
assertions:
  - type: "json_path"
    expression: "$.body.data.balance"
    operator: "gte"
    expected: 0
    message: "Account balance should never be negative"
```

### Create Reusable Assertion Libraries

```yaml
# assertions/api_standards.yaml
definitions:
  - id: "api.success_response"
    type: "json_path"
    expression: "$.status"
    operator: "equals"
    expected: 200
    
  - id: "api.created_response"
    type: "json_path"
    expression: "$.status"
    operator: "equals"
    expected: 201
    
  - id: "api.has_request_id"
    type: "json_path"
    expression: "$.header['X-Request-ID']"
    operator: "exists"
```
