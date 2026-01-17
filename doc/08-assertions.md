# 8. Assertions

Assertions define validation rules for test responses. TSpec provides built-in assertion types and supports custom JavaScript assertions.

## Assertion Structure

```yaml
assertions:
  - type: "<assertion_type>"
    # type-specific fields...
    message: "Optional custom failure message"
```

## Built-in Assertion Types

### `status_code`

Validates HTTP status code.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `expected` | integer | Yes | Expected HTTP status code |

```yaml
assertions:
  - type: "status_code"
    expected: 200

  - type: "status_code"
    expected: 201
    message: "User creation should return 201"
```

### `grpc_code`

Validates gRPC status code.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `expected` | string | Yes | Expected gRPC code |

```yaml
assertions:
  - type: "grpc_code"
    expected: "OK"

  - type: "grpc_code"
    expected: "NOT_FOUND"
    message: "Should return NOT_FOUND for missing user"
```

**Common gRPC codes**: `OK`, `CANCELLED`, `UNKNOWN`, `INVALID_ARGUMENT`, `DEADLINE_EXCEEDED`, `NOT_FOUND`, `ALREADY_EXISTS`, `PERMISSION_DENIED`, `UNAUTHENTICATED`

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

### `json_path`

Validates JSON response using JSONPath expressions.

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
    expression: "$.data.token"
    operator: "exists"

  # Check exact value
  - type: "json_path"
    expression: "$.data.status"
    operator: "equals"
    expected: "active"

  # Check regex pattern
  - type: "json_path"
    expression: "$.data.email"
    operator: "matches"
    pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"

  # Check contains
  - type: "json_path"
    expression: "$.message"
    operator: "contains"
    expected: "success"

  # Check not empty
  - type: "json_path"
    expression: "$.data.items"
    operator: "not_empty"

  # Check numeric comparison
  - type: "json_path"
    expression: "$.data.count"
    operator: "gt"
    expected: 0
```

#### JSONPath Expression Examples

| Expression | Description |
|------------|-------------|
| `$.data` | Root-level `data` field |
| `$.data.user.name` | Nested field |
| `$.data.items[0]` | First array element |
| `$.data.items[*].id` | All `id` fields in array |
| `$.data.items.length` | Array length |

### `header`

Validates HTTP response headers.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Header name (case-insensitive) |
| `operator` | string | Yes | Comparison operator |
| `value` | string | Depends | Expected value |

```yaml
assertions:
  - type: "header"
    name: "Content-Type"
    operator: "contains"
    value: "application/json"

  - type: "header"
    name: "X-Request-ID"
    operator: "exists"

  - type: "header"
    name: "Cache-Control"
    operator: "equals"
    value: "no-cache"
```

### `proto_field`

Validates Protobuf response fields (for gRPC).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | string | Yes | Dot-notation field path |
| `operator` | string | Yes | Comparison operator |
| `expected` | any | Depends | Expected value |

```yaml
assertions:
  - type: "proto_field"
    path: "user.name"
    operator: "not_empty"

  - type: "proto_field"
    path: "user.status"
    operator: "equals"
    expected: "ACTIVE"
```

### `javascript`

Custom JavaScript assertion for complex validation.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `source` | string | Yes | JavaScript code returning boolean |

Available variables in scope:
- `response` - Full response object
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
| `length` | Array/string length | `expected: 5` |

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
    type: "status_code"
    expected: 200

  - id: "common.json_content_type"
    type: "header"
    name: "Content-Type"
    operator: "contains"
    value: "application/json"

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
      type: "status_code",
      expected: 200,
      actual: 200,
      message: "Status code is 200"
    },
    {
      passed: true,
      type: "json_path",
      expression: "$.data.token",
      operator: "exists",
      actual: "eyJhbGc...",
      message: "JSONPath $.data.token exists assertion passed"
    }
  ],
  summary: {
    total: 2,
    passed: 2,
    failed: 0,
    passRate: 100
  },
  extracted: {
    token: "eyJhbGc..."
  }
}
```

## Best Practices

### Order Assertions Logically

```yaml
assertions:
  # 1. Status code first (fail fast)
  - type: "status_code"
    expected: 200
    
  # 2. Response time
  - type: "response_time"
    max_ms: 1000
    
  # 3. Headers
  - type: "header"
    name: "Content-Type"
    operator: "contains"
    value: "application/json"
    
  # 4. Body structure
  - type: "json_path"
    expression: "$.data"
    operator: "exists"
    
  # 5. Specific values
  - type: "json_path"
    expression: "$.data.status"
    operator: "equals"
    expected: "active"
```

### Use Meaningful Messages

```yaml
assertions:
  - type: "json_path"
    expression: "$.data.balance"
    operator: "gte"
    expected: 0
    message: "Account balance should never be negative"
```

### Create Reusable Assertion Libraries

```yaml
# assertions/api_standards.yaml
definitions:
  - id: "api.success_response"
    type: "status_code"
    expected: 200
    
  - id: "api.created_response"
    type: "status_code"
    expected: 201
    
  - id: "api.has_request_id"
    type: "header"
    name: "X-Request-ID"
    operator: "exists"
```
