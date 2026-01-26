# 5. Field Reference

Detailed reference for all TSpec fields.

## `metadata`

**Optional**. Contains AI generation context and test categorization.

> **Note**: All metadata fields are **optional**. You can include only the fields relevant to your test case.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prompt` | string | No | Natural language description for AI generation |
| `related_code` | list[string] | No | Related source code paths (relative to repo root) |
| `test_category` | enum | No | Test type category |
| `risk_level` | enum | No | Risk level assessment |
| `tags` | list[string] | No | Tags for filtering and grouping |
| `priority` | enum | No | Execution priority |
| `timeout` | duration | No | Maximum execution time |
| `business_rule` | string | No | Business rule ID or description |

### `prompt`

Natural language description guiding AI test generation. Should include:
- Test objective
- Input requirements
- Expected output
- Boundary conditions

```yaml
metadata:
  prompt: |
    Verify that user login with valid credentials:
    - Username: test_user_001 (from variables)
    - Password: from environment variable TEST_PASSWORD
    
    Expected results:
    - HTTP 200 status code
    - Response contains valid JWT token (format: xxx.yyy.zzz)
    - Response time under 1 second
```

### `related_code`

Paths to related source files. Helps AI understand implementation context.

#### Format

The `related_code` field supports optional line references to point to specific code locations:

| Format | Example | Description |
|--------|---------|-------------|
| Plain path | `"src/auth/login.js"` | Reference entire file |
| Single line | `"src/auth/login.js[42]"` | Reference specific line |
| Line range | `"src/auth/login.js[10-20]"` | Reference line range |
| Multiple | `"src/auth/login.js[1,5-10,20]"` | Multiple line references |

#### Syntax

```
path/to/file.ext[line_specs]
```

Where `line_specs` is a comma-separated list of:
- Single line: `N` (e.g., `42`)
- Line range: `N-M` (e.g., `10-20`)

#### Validation Rules

- Line numbers must be positive integers (1-based)
- Range end must be >= start
- File path cannot contain `[` or `]` characters

#### Examples

```yaml
metadata:
  related_code:
    # Plain paths (backward compatible)
    - "src/controllers/auth.controller.js"
    - "src/services/auth.service.js"
    
    # With line references
    - "src/models/user.model.js[25-45]"
    - "src/utils/validation.js[100,150-160,200]"
```

### `business_rule`

Optional business rule reference.

```yaml
metadata:
  business_rule: "AUTH-001: Valid credentials must return session token"
```

### `test_category`

| Value | Description |
|-------|-------------|
| `functional` | Tests business logic and features |
| `integration` | Tests component interactions |
| `performance` | Tests response times and throughput |
| `security` | Tests security controls |

```yaml
metadata:
  test_category: "functional"
```

### `risk_level`

| Value | Description |
|-------|-------------|
| `low` | Minor impact if fails |
| `medium` | Moderate impact |
| `high` | Significant impact |
| `critical` | System-critical functionality |

```yaml
metadata:
  risk_level: "high"
```

### `tags`

List of tags for filtering and organization.

```yaml
metadata:
  tags: ["auth", "login", "smoke", "regression"]
```

### `priority`

Execution priority for test ordering.

| Value | Description |
|-------|-------------|
| `low` | Run after higher priority tests |
| `medium` | Normal priority |
| `high` | Run early in test suite |

```yaml
metadata:
  priority: "high"
```

### `timeout`

Maximum execution time. Format: number + unit.

| Unit | Examples |
|------|----------|
| `s` | `10s`, `30s` |
| `m` | `1m`, `5m` |
| `ms` | `500ms`, `1500ms` |

```yaml
metadata:
  timeout: "30s"
```

---

## `environment`

**Optional**. Runtime environment configuration.

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Environment name |
| `host` | string | API host address |
| `port` | string | Port number |
| `scheme` | string | Protocol scheme (http/https) |
| `variables` | object | Environment-level variables |

```yaml
environment:
  name: "${ENV_NAME|staging}"
  host: "${API_HOST|api.example.com}"
  port: "${API_PORT|443}"
  scheme: "https"
  variables:
    max_retry: 3
    base_path: "/v1"
```

### Variable Resolution Priority

1. Command line parameters
2. System environment variables
3. Case-level `variables`
4. Template variables

---

## `variables`

**Optional**. Case-level static variables with file scope.

```yaml
variables:
  user_id: "U123456"
  timestamp: "${timestamp}"          # Built-in function
  uuid: "${uuid}"                    # Built-in function
  random_num: "${random_int(1,100)}" # Function with args
```

See [Variables and Expressions](./06-variables-expressions.md) for complete reference.

---

## `data`

**Optional**. Data source for parameterized testing.

| Field | Type | Description |
|-------|------|-------------|
| `source` | string | Path to data file |
| `driver` | string | Driver mode (`parameterized`) |
| `format` | string | File format (`csv`, `json`, `yaml`) |
| `current_row` | number | Row index for single-row mode |

```yaml
data:
  source: "datasets/login_cases.csv"
  driver: "parameterized"
  format: "csv"
```

See [Data-Driven Testing](./07-data-driven-testing.md) for details.

---

## `extends`

**Optional**. Template inheritance path.

```yaml
extends: "_templates/base_http.yaml"
```

See [Template Inheritance](./09-template-inheritance.md) for details.

---

## `lifecycle`

**Optional**. Setup and teardown hooks.

| Field | Type | Description |
|-------|------|-------------|
| `setup` | list[action] | Pre-test actions |
| `teardown` | list[action] | Post-test actions |

### Action Structure

| Field | Type | Description |
|-------|------|-------------|
| `action` | string | Action type |
| `params` | object | Action parameters |
| `target` | string | Target path (for api.call) |
| `method` | string | HTTP method (for api.call) |

```yaml
lifecycle:
  setup:
    - action: "db.reset_table"
      params:
        table: "users"
        condition: "username LIKE 'test_%'"
    - action: "api.call"
      target: "/v1/test/setup"
      method: "POST"
  teardown:
    - action: "cache.clear"
      params:
        pattern: "user:*"
```

### Standard Action Library

| Action | Description |
|--------|-------------|
| `db.reset_table` | Reset database table |
| `db.insert_record` | Insert record |
| `cache.clear` | Clear cache entries |
| `cache.set` | Set cache value |
| `api.call` | Make API call |
| `log.test_start` | Log test start |

---

## `extract`

**Optional**. Extract values from response for later use.

```yaml
extract:
  session_token: "$.data.token"
  user_id: "$.data.user.id"
  response_code: "$.code"
```

Extracted values can be referenced as `${extract.session_token}`.

---

## `output`

**Optional**. Result handling configuration.

| Field | Type | Description |
|-------|------|-------------|
| `save_response_on_failure` | boolean | Save full response on failure |
| `metrics` | list[string] | Metrics to report |
| `notifications` | list[notification] | Notification configuration |

```yaml
output:
  save_response_on_failure: true
  metrics: ["latency", "throughput"]
  notifications:
    - type: "slack"
      channel: "#test-alerts"
      condition: "failure"
```

### Notification Conditions

| Value | Description |
|-------|-------------|
| `failure` | Notify on failure only |
| `success` | Notify on success only |
| `always` | Always notify |
