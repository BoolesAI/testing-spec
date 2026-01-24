# 12. Examples

Complete examples demonstrating various TSpec features.

## Basic HTTP Test

**tests/health_check.http.tspec**:
```yaml
version: "1.0"
description: "API health check endpoint"

metadata:
  prompt: "Verify the health check endpoint returns 200 OK"
  related_code: ["src/routes/health.js"]
  test_category: "functional"
  risk_level: "low"
  tags: ["health", "smoke"]
  priority: "high"
  timeout: "5s"

environment:
  host: "${API_HOST|localhost:3000}"
  scheme: "http"

http:
  method: "GET"
  path: "/health"

assertions:
  - type: "status_code"
    expected: 200
  - type: "json_path"
    expression: "$.status"
    operator: "equals"
    expected: "ok"
  - type: "response_time"
    max_ms: 500
```

---

## Authentication Flow

### Login Test

**tests/auth/login_success.http.tspec**:
```yaml
version: "1.0"
description: "User login with valid credentials"

metadata:
  prompt: |
    Test successful user authentication:
    - Valid username and password
    - Should return JWT token
    - Token should be valid format (xxx.yyy.zzz)
  related_code:
    - "src/controllers/auth.controller.js"
    - "src/services/auth.service.js"
  business_rule: "AUTH-001: Valid credentials return session token"
  test_category: "functional"
  risk_level: "critical"
  tags: ["auth", "login", "smoke", "security"]
  priority: "high"
  timeout: "10s"

environment:
  host: "${API_HOST|api.example.com}"
  scheme: "https"

variables:
  username: "test_user_001"

http:
  method: "POST"
  path: "/api/v1/auth/login"
  headers:
    Content-Type: "application/json"
    X-Request-ID: "${uuid}"
  body:
    json:
      username: "${username}"
      password: "${env.TEST_PASSWORD}"

assertions:
  - type: "status_code"
    expected: 200
  - type: "json_path"
    expression: "$.data.token"
    operator: "matches"
    pattern: "^[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+$"
  - type: "json_path"
    expression: "$.data.user.username"
    operator: "equals"
    expected: "${username}"
  - type: "json_path"
    expression: "$.data.expires_in"
    operator: "gt"
    expected: 0
  - type: "response_time"
    max_ms: 1000

extract:
  auth_token: "$.data.token"
  user_id: "$.data.user.id"

output:
  save_response_on_failure: true
```

### Login Failure Test

**tests/auth/login_invalid_password.http.tspec**:
```yaml
version: "1.0"
description: "Login fails with invalid password"

metadata:
  prompt: "Test that invalid password returns 401 Unauthorized"
  related_code: ["src/controllers/auth.controller.js"]
  test_category: "security"
  risk_level: "high"
  tags: ["auth", "login", "security", "negative"]
  priority: "high"
  timeout: "10s"

environment:
  host: "${API_HOST|api.example.com}"
  scheme: "https"

http:
  method: "POST"
  path: "/api/v1/auth/login"
  headers:
    Content-Type: "application/json"
  body:
    json:
      username: "test_user_001"
      password: "wrong_password_123"

assertions:
  - type: "status_code"
    expected: 401
  - type: "json_path"
    expression: "$.error.code"
    operator: "equals"
    expected: "INVALID_CREDENTIALS"
  - type: "json_path"
    expression: "$.data.token"
    operator: "not_exists"
```

---

## Data-Driven Test

**tests/auth/login_scenarios.http.tspec**:
```yaml
version: "1.0"
description: "Login scenarios - data driven"

metadata:
  prompt: |
    Test various login scenarios using data-driven approach.
    Covers: valid credentials, invalid password, missing fields, locked account.
  related_code: ["src/controllers/auth.controller.js"]
  test_category: "functional"
  risk_level: "high"
  tags: ["auth", "login", "data-driven"]
  priority: "high"
  timeout: "10s"

data:
  source: "../../datasets/login_scenarios.csv"
  driver: "parameterized"
  format: "csv"

environment:
  host: "${API_HOST|api.example.com}"
  scheme: "https"

http:
  method: "POST"
  path: "/api/v1/auth/login"
  headers:
    Content-Type: "application/json"
  body:
    json:
      username: "${username}"
      password: "${password}"

assertions:
  - type: "status_code"
    expected: ${expected_status}
  - type: "json_path"
    expression: "$.error.code"
    operator: "equals"
    expected: "${expected_error_code}"
```

**datasets/login_scenarios.csv**:
```csv
username,password,expected_status,expected_error_code
valid_user,correct_password,200,
valid_user,wrong_password,401,INVALID_CREDENTIALS
,correct_password,400,MISSING_USERNAME
valid_user,,400,MISSING_PASSWORD
locked_user,correct_password,403,ACCOUNT_LOCKED
```

---

## Template Inheritance

### Base Template

**_templates/base_api.yaml**:
```yaml
environment:
  host: "${API_HOST|api.example.com}"
  scheme: "https"
  variables:
    api_version: "v1"

http:
  headers:
    Content-Type: "application/json"
    Accept: "application/json"
    X-Request-ID: "${uuid}"
    X-Client-Version: "1.0.0"

assertions:
  - type: "header"
    name: "Content-Type"
    operator: "contains"
    value: "application/json"
  - type: "response_time"
    max_ms: 5000
```

### Authenticated Template

**_templates/authenticated.yaml**:
```yaml
extends: "./base_api.yaml"

http:
  headers:
    Authorization: "Bearer ${env.AUTH_TOKEN}"
```

### Test Using Template

**tests/users/get_profile.http.tspec**:
```yaml
version: "1.0"
description: "Get current user profile"

metadata:
  prompt: "Fetch authenticated user's profile data"
  related_code: ["src/controllers/user.controller.js"]
  test_category: "functional"
  risk_level: "medium"
  tags: ["user", "profile"]
  priority: "medium"
  timeout: "10s"

extends: "../../_templates/authenticated.yaml"

http:
  method: "GET"
  path: "/api/${api_version}/users/me"

assertions:
  - type: "status_code"
    expected: 200
  - type: "json_path"
    expression: "$.data.id"
    operator: "exists"
  - type: "json_path"
    expression: "$.data.email"
    operator: "matches"
    pattern: "^[^@]+@[^@]+\\.[^@]+$"

extract:
  user_id: "$.data.id"
  user_email: "$.data.email"
```

---

## CRUD Operations

### Create Resource

**tests/products/create.http.tspec**:
```yaml
version: "1.0"
description: "Create new product"

metadata:
  prompt: "Test product creation with valid data"
  related_code: ["src/controllers/product.controller.js"]
  test_category: "functional"
  risk_level: "medium"
  tags: ["product", "create", "crud"]
  priority: "medium"
  timeout: "10s"

extends: "../../_templates/authenticated.yaml"

variables:
  product_name: "Test Product ${timestamp}"
  product_sku: "SKU-${random_int(10000, 99999)}"

http:
  method: "POST"
  path: "/api/v1/products"
  body:
    json:
      name: "${product_name}"
      sku: "${product_sku}"
      price: 99.99
      category: "electronics"
      inventory: 100

assertions:
  - type: "status_code"
    expected: 201
  - type: "json_path"
    expression: "$.data.id"
    operator: "exists"
  - type: "json_path"
    expression: "$.data.name"
    operator: "equals"
    expected: "${product_name}"
  - type: "header"
    name: "Location"
    operator: "matches"
    value: "^/api/v1/products/[a-zA-Z0-9]+$"

extract:
  product_id: "$.data.id"

lifecycle:
  teardown:
    - action: "api.call"
      target: "/api/v1/products/${product_id}"
      method: "DELETE"
```

---

## gRPC Example

**tests/grpc/get_user.grpc.tspec**:
```yaml
version: "1.0"
description: "Get user profile via gRPC"

metadata:
  prompt: "Test gRPC user service GetProfile method"
  related_code: ["src/grpc/user_service.go"]
  test_category: "functional"
  risk_level: "medium"
  tags: ["user", "grpc"]
  priority: "medium"
  timeout: "10s"

environment:
  host: "${GRPC_HOST|localhost}"
  port: "${GRPC_PORT|50051}"

variables:
  target_user_id: "U123456"

grpc:
  service: "user.UserService"
  method: "GetProfile"
  package: "com.example.user"
  proto_file: "protos/user.proto"
  deadline_ms: 5000
  metadata:
    authorization: "Bearer ${env.AUTH_TOKEN}"
    x-request-id: "${uuid}"
  request:
    user_id: "${target_user_id}"
    include_email: true
    include_preferences: false

assertions:
  - type: "grpc_code"
    expected: "OK"
  - type: "proto_field"
    path: "user.id"
    operator: "equals"
    expected: "${target_user_id}"
  - type: "proto_field"
    path: "user.email"
    operator: "not_empty"
  - type: "response_time"
    max_ms: 500

extract:
  user_name: "user.display_name"
  user_email: "user.email"
```

---

## Custom JavaScript Assertion

**tests/orders/calculate_total.http.tspec**:
```yaml
version: "1.0"
description: "Verify order total calculation"

metadata:
  prompt: "Test that order total equals sum of item prices plus tax"
  related_code: ["src/services/order.service.js"]
  test_category: "functional"
  risk_level: "high"
  tags: ["order", "calculation"]
  priority: "high"
  timeout: "10s"

extends: "../../_templates/authenticated.yaml"

http:
  method: "GET"
  path: "/api/v1/orders/ORD-123"

assertions:
  - type: "status_code"
    expected: 200
  - type: "javascript"
    source: |
      // Verify total calculation
      const items = body.data.items;
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const tax = subtotal * body.data.tax_rate;
      const expectedTotal = subtotal + tax;
      const actualTotal = body.data.total;
      
      // Allow small floating point difference
      return Math.abs(expectedTotal - actualTotal) < 0.01;
    message: "Order total should equal sum of items plus tax"
  - type: "javascript"
    source: |
      // Verify all items have positive quantities
      return body.data.items.every(item => item.quantity > 0);
    message: "All items should have positive quantities"
```

---

## Assertion Library Usage

**_templates/assertions/common.yaml**:
```yaml
definitions:
  - id: "common.success"
    type: "status_code"
    expected: 200

  - id: "common.created"
    type: "status_code"
    expected: 201

  - id: "common.json_response"
    type: "header"
    name: "Content-Type"
    operator: "contains"
    value: "application/json"

  - id: "common.fast_response"
    type: "response_time"
    max_ms: 1000

  - id: "common.has_data"
    type: "json_path"
    expression: "$.data"
    operator: "exists"
```

**tests/api/test_with_includes.http.tspec**:
```yaml
version: "1.0"
description: "Test using assertion includes"

metadata:
  prompt: "Test with reusable assertions"
  related_code: ["src/api.js"]
  test_category: "functional"
  risk_level: "low"
  tags: ["example"]
  priority: "low"
  timeout: "10s"

http:
  method: "GET"
  path: "/api/v1/status"

assertions:
  - include: "../../_templates/assertions/common.yaml#common.success"
  - include: "../../_templates/assertions/common.yaml#common.json_response"
  - include: "../../_templates/assertions/common.yaml#common.fast_response"
  - include: "../../_templates/assertions/common.yaml#common.has_data"
  - type: "json_path"
    expression: "$.data.version"
    operator: "matches"
    pattern: "^\\d+\\.\\d+\\.\\d+$"
```
