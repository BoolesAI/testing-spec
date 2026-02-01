# 4. Core Structure

Every `.tcase` file follows a consistent top-level schema. This section describes the overall structure and field ordering.

## Top-Level Schema

```yaml
version: "1.0"                  # Required - DSL version
description: "..."              # Required - Test description

metadata:                       # Required - AI and collaboration metadata
environment:                    # Optional - Runtime environment
variables:                      # Optional - Case-level variables
data:                           # Optional - Data source configuration
extends:                        # Optional - Template inheritance
lifecycle:                      # Optional - Setup/teardown hooks with scope control
{protocol}:                     # Required - Protocol block (http, grpc, etc.)
assertions:                     # Required - Validation rules
```

## Required Fields

### `version`

DSL specification version. Currently only `"1.0"` is supported.

```yaml
version: "1.0"
```

### `description`

Natural language description of the test's purpose. Should be concise but descriptive.

```yaml
description: "Verify user login with valid credentials returns JWT token"
```

### `metadata`

AI and collaboration metadata. All fields are optional - include only what's relevant. See [Field Reference](./05-field-reference.md#metadata) for details.

```yaml
metadata:
  prompt: |
    Test successful login flow...
  related_code:
    - "src/auth/login.js"
  test_category: "functional"
  risk_level: "high"
  tags: ["auth", "smoke"]
  priority: "high"
  timeout: "10s"
```

### Protocol Block

One of: `http`, `grpc`, `graphql`, `websocket`. See [Protocol Reference](./10-protocol-reference.md).

```yaml
http:
  method: "POST"
  path: "/api/login"
  body:
    json:
      username: "test"
```

### `assertions`

List of validation rules. See [Assertions](./08-assertions.md).

```yaml
assertions:
  - type: "json_path"
    expression: "$.status"
    operator: "equals"
    expected: 200
```

## Optional Fields

### `environment`

Runtime environment configuration.

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

### `variables`

Case-level static variables.

```yaml
variables:
  user_id: "U123456"
  timestamp: "${timestamp}"
```

### `data`

External data source for parameterized testing.

```yaml
data:
  source: "datasets/login_cases.csv"
  driver: "parameterized"
  format: "csv"
```

### `extends`

Template inheritance path.

```yaml
extends: "templates/base_auth.yaml"
```

### `lifecycle`

Setup and teardown hooks with scope-based execution control.

```yaml
lifecycle:
  setup:
    - action: "script"
      scope: "test"
      source: |
        return { test_id: "TEST_" + Date.now() };
  teardown:
    - action: "extract"
      scope: "assert"
      vars:
        token: "$.data.token"
```

See [Lifecycle Reference](./05-field-reference.md#lifecycle) for complete details.

## Field Order Recommendation

While YAML doesn't require specific ordering, the following order improves readability:

1. `version` - Specification version first
2. `description` - Human-readable purpose
3. `metadata` - AI and collaboration context
4. `extends` - Template inheritance (if any)
5. `environment` - Runtime configuration
6. `variables` - Static variables
7. `data` - Data sources
8. `lifecycle` - Setup/teardown hooks
9. `{protocol}` - Request definition
10. `assertions` - Validation rules

## Complete Example

```yaml
version: "1.0"
description: "Verify successful user registration with valid data"

metadata:
  prompt: |
    Test that a new user can register with valid email and password.
    Should return 201 status and user object with generated ID.
  related_code:
    - "src/controllers/user.controller.js"
    - "src/services/user.service.js"
  business_rule: "USER-001: Registration creates new user account"
  test_category: "functional"
  risk_level: "high"
  tags: ["user", "registration", "smoke"]
  priority: "high"
  timeout: "15s"

extends: "_templates/base_http.yaml"

environment:
  host: "${API_HOST|api.example.com}"
  scheme: "https"

variables:
  email: "test_${timestamp}@example.com"
  password: "SecurePass123!"

lifecycle:
  setup:
    - action: "script"
      scope: "test"
      source: |
        return { test_id: "TEST_" + Date.now() };
  teardown:
    - action: "script"
      scope: "test"
      source: |
        // Cleanup: Delete test user
        console.log("Cleaning up user: " + email);
        return {};
    - action: "extract"
      scope: "assert"
      vars:
        user_id: "$.data.id"
    - action: "output"
      scope: "test"
      config:
        save_response_on_failure: true

http:
  method: "POST"
  path: "/api/v1/users"
  headers:
    Content-Type: "application/json"
  body:
    json:
      email: "${email}"
      password: "${password}"
      name: "Test User"

assertions:
  - type: "json_path"
    expression: "$.status"
    operator: "equals"
    expected: 201
  - type: "json_path"
    expression: "$.data.id"
    operator: "exists"
  - type: "json_path"
    expression: "$.data.email"
    operator: "equals"
    expected: "${email}"
  - type: "response_time"
    max_ms: 2000
```
