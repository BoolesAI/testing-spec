# TSpec Examples

## 1. List Protocols Examples

### Basic Usage

#### List All Protocols

```bash
tspec list
```

Example output:
```
TSpec Protocol Support
======================

Supported Protocols:
  - http:    HTTP/HTTPS REST API testing
  - grpc:    gRPC service testing with protobuf

Reserved for Future:
  - graphql: GraphQL API testing (not yet implemented)
  - websocket: WebSocket testing (not yet implemented)

Version: 1.0
```

### Output Formats

#### Text Output (Default)

```bash
tspec list
```

Human-readable format for terminal display.

#### JSON Output

```bash
tspec list --output json
```

Example output:
```json
{
  "version": "1.0",
  "protocols": {
    "supported": [
      {
        "name": "http",
        "description": "HTTP/HTTPS REST API testing",
        "features": ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]
      },
      {
        "name": "grpc",
        "description": "gRPC service testing with protobuf",
        "features": ["unary", "server-streaming", "client-streaming", "bidirectional"]
      }
    ],
    "reserved": ["graphql", "websocket"]
  }
}
```

### MCP Tool Examples

#### Text Output

```json
{
  "output": "text"
}
```

#### JSON Output for Programmatic Use

```json
{
  "output": "json"
}
```

### Use Cases

#### Verify Installation

```bash
# Quick check that tspec is working
tspec list
```

#### Check Protocol Support Before Writing Tests

```bash
# Confirm gRPC is supported before writing gRPC tests
tspec list | grep grpc
```

#### Programmatic Protocol Discovery

```bash
# Get supported protocols as JSON for scripts
tspec list --output json | jq '.protocols.supported[].name'
```

Output:
```
"http"
"grpc"
```

#### CI/CD Environment Verification

```yaml
# GitHub Actions example
- name: Verify TSpec installation
  run: npx @boolesai/tspec-cli list
```

---

## 2. Validate Examples

### Basic Validation

#### Validate Single File

```bash
tspec validate tests/login_success.http.tcase
```

#### Validate All Test Files

```bash
tspec validate "tests/**/*.tcase"
```

#### Validate HTTP Tests Only

```bash
tspec validate "tests/**/*.http.tcase"
```

### Output Formats

#### Text Output (Default)

```bash
tspec validate tests/*.tcase
```

Example output:
```
Validating 3 files...

✓ tests/login_success.http.tcase
✓ tests/create_user.http.tcase
✗ tests/invalid_test.http.tcase
  Line 5: Missing required field 'method' in http block

Validation complete: 2 passed, 1 failed
```

#### JSON Output

```bash
tspec validate tests/*.tcase --output json
```

Example output:
```json
{
  "total": 3,
  "valid": 2,
  "invalid": 1,
  "results": [
    { "file": "tests/login_success.http.tcase", "valid": true },
    { "file": "tests/create_user.http.tcase", "valid": true },
    { 
      "file": "tests/invalid_test.http.tcase", 
      "valid": false,
      "errors": [
        { "line": 5, "message": "Missing required field 'method' in http block" }
      ]
    }
  ]
}
```

#### Quiet Mode

```bash
tspec validate tests/*.tcase -q
```

Only outputs errors, no success messages.

### MCP Tool Examples

#### Basic Validation

```json
{
  "files": ["tests/*.tcase"]
}
```

#### JSON Output for Processing

```json
{
  "files": ["tests/**/*.http.tcase"],
  "output": "json"
}
```

### CI/CD Integration

#### GitHub Actions

```yaml
- name: Validate TSpec files
  run: npx @boolesai/tspec-cli validate "tests/**/*.tcase"
```

#### GitLab CI

```yaml
validate:
  stage: lint
  script:
    - npx @boolesai/tspec-cli validate "tests/**/*.tcase" --output json
```

#### Pre-commit Hook

```bash
#!/bin/sh
# .git/hooks/pre-commit

# Get staged .tcase files
TSPEC_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep '\.tcase$')

if [ -n "$TSPEC_FILES" ]; then
  echo "Validating TSpec files..."
  npx @boolesai/tspec-cli validate $TSPEC_FILES
  if [ $? -ne 0 ]; then
    echo "TSpec validation failed. Please fix errors before committing."
    exit 1
  fi
fi
```

### Common Validation Errors

#### Missing Required Field

```
Error: Missing required field 'version' at root level
```

Fix: Add `version: "1.0"` to the test file.

#### Invalid HTTP Method

```
Error: Invalid HTTP method 'FETCH'. Expected one of: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
```

Fix: Use a valid HTTP method.

#### Invalid Assertion Type

```
Error: Unknown assertion type 'body'. Use 'json_path' with expression "$.body.*" instead.
```

Fix: Use proper assertion syntax with valid types (`json_path`, `string`, `number`, `regex`, `xml_path`, `response_time`, `javascript`, `file_exist`, `file_read`, `exception`).

#### Missing Protocol Block

```
Error: At least one protocol block (http, grpc) is required
```

Fix: Add an `http:` or `grpc:` block to the test file.

### Validate and Run Workflow

```bash
# Validate first, then run if valid
tspec validate tests/*.tcase && tspec run tests/*.tcase
```

---

## 3. Parse Examples

### Basic Parsing

#### Parse Single File

```bash
tspec parse tests/login_success.http.tcase
```

#### Parse Multiple Files

```bash
tspec parse "tests/**/*.tcase"
```

### Variable Substitution Debugging

#### With Environment Variables

```bash
tspec parse tests/login.http.tcase -e API_HOST=localhost -e API_PORT=3000
```

#### With Parameters

```bash
tspec parse tests/login.http.tcase -p username=testuser -p password=testpass
```

#### Combined Environment and Parameters

```bash
tspec parse tests/login.http.tcase \
  -e API_HOST=localhost \
  -p username=testuser
```

### Output Formats

#### Text Output (Default)

```bash
tspec parse tests/login.http.tcase
```

Example output:
```
Test: Login Success Test
Description: Verify successful user login

HTTP Request:
  Method: POST
  URL: http://localhost:3000/api/auth/login
  Headers:
    Content-Type: application/json
  Body:
    {"username": "testuser", "password": "testpass"}

Assertions:
  - status equals 200
  - json $.token exists
  - json $.user.id exists
```

#### Verbose Output

```bash
tspec parse tests/login.http.tcase -v
```

Includes:
- Full metadata
- Variable resolution trace
- Template inheritance chain
- All headers (including defaults)

#### JSON Output

```bash
tspec parse tests/login.http.tcase --output json
```

Example output:
```json
{
  "version": "1.0",
  "description": "Login Success Test",
  "metadata": {
    "prompt": "Test successful login flow",
    "test_category": "functional",
    "priority": "high"
  },
  "http": {
    "method": "POST",
    "path": "/api/auth/login",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": {
      "json": {
        "username": "testuser",
        "password": "testpass"
      }
    }
  },
  "assertions": [
    { "type": "status", "expected": 200 },
    { "type": "json", "path": "$.token", "operator": "exists" }
  ]
}
```

### MCP Tool Examples

#### Basic Parse

```json
{
  "files": ["tests/login.http.tcase"]
}
```

#### Parse with Variables

```json
{
  "files": ["tests/login.http.tcase"],
  "env": {
    "API_HOST": "localhost",
    "API_PORT": "3000"
  },
  "params": {
    "username": "testuser"
  },
  "verbose": true
}
```

#### JSON Output for Processing

```json
{
  "files": ["tests/*.tcase"],
  "output": "json"
}
```

### Debugging Workflows

#### Debug Unresolved Variables

```bash
# See which variables couldn't be resolved
tspec parse tests/login.http.tcase -v 2>&1 | grep -i "unresolved"
```

#### Compare Variable Resolution

```bash
# Development environment
tspec parse tests/api.http.tcase -e API_HOST=localhost

# Production environment
tspec parse tests/api.http.tcase -e API_HOST=api.example.com
```

#### Inspect Template Inheritance

```bash
# See how base template merges with test
tspec parse tests/auth_with_base.http.tcase -v
```

### Data-Driven Test Inspection

#### View Expanded Test Cases

```bash
tspec parse tests/login_data_driven.http.tcase -v
```

Shows all test case variations from CSV/JSON data sources.

### Parse Before Run Workflow

```bash
# 1. Parse to verify request looks correct
tspec parse tests/new_test.http.tcase -v

# 2. If satisfied, run the test
tspec run tests/new_test.http.tcase
```

### Quiet Mode

```bash
tspec parse tests/*.tcase -q
```

Minimal output, only shows essential information or errors.

---

## 4. Run Examples

### Basic Examples

#### Run Single Test File

```bash
tspec run tests/login_success.http.tcase
```

#### Run All HTTP Tests

```bash
tspec run "tests/**/*.http.tcase"
```

#### Run All Tests with Glob Pattern

```bash
tspec run "tests/*.tcase"
```

### Environment Variables

#### Single Environment Variable

```bash
tspec run tests/*.tcase -e API_HOST=localhost
```

#### Multiple Environment Variables

```bash
tspec run tests/*.tcase \
  -e API_HOST=api.example.com \
  -e API_KEY=secret123 \
  -e API_PORT=8080
```

#### MCP Tool with Environment

```json
{
  "files": ["tests/*.tcase"],
  "env": {
    "API_HOST": "api.example.com",
    "API_KEY": "secret123",
    "API_PORT": "8080"
  }
}
```

### Parameters

#### Pass Test Parameters

```bash
tspec run tests/*.tcase -p username=testuser -p password=testpass
```

#### MCP Tool with Parameters

```json
{
  "files": ["tests/login.http.tcase"],
  "params": {
    "username": "testuser",
    "password": "testpass"
  }
}
```

### Concurrency Control

#### Run with Higher Concurrency

```bash
tspec run tests/*.tcase -c 10
```

#### Run Tests Sequentially

```bash
tspec run tests/*.tcase -c 1
```

### Output Formats

#### JSON Output for CI/CD

```bash
tspec run tests/*.tcase --output json
```

#### Verbose Text Output

```bash
tspec run tests/*.tcase -v
```

#### Quiet Mode (Summary Only)

```bash
tspec run tests/*.tcase -q
```

### Failure Handling

#### Stop on First Failure

```bash
tspec run tests/*.tcase --fail-fast
```

### CI/CD Integration

#### GitHub Actions

```yaml
- name: Run TSpec tests
  run: |
    npx @boolesai/tspec-cli run tests/*.tcase --output json > results.json
```

#### GitLab CI

```yaml
test:
  script:
    - npx @boolesai/tspec-cli run tests/*.tcase --output json
  artifacts:
    reports:
      junit: results.json
```

### Combined Examples

#### Full CI/CD Run

```bash
tspec run "tests/**/*.tcase" \
  -e API_HOST=staging.example.com \
  -e API_KEY=$API_KEY \
  -c 10 \
  --output json \
  --fail-fast
```

#### Debug Run with Verbose Output

```bash
tspec run tests/failing_test.http.tcase \
  -v \
  -e DEBUG=true \
  -c 1
```

---

## 5. Generate Examples

### Basic Examples

#### Generate Test for GET Endpoint

Given a controller with a GET endpoint:

```typescript
// src/controllers/books.ts
router.get('/api/v1/books/:id', async (req, res) => {
  const book = await bookService.findById(req.params.id);
  if (!book) {
    return res.status(404).json({ error: 'Book not found' });
  }
  res.json(book);
});
```

Generate test file `get_book_success.http.tcase`:

```yaml
version: "1.0"
description: "Get a book by ID returns book details"

metadata:
  prompt: |
    Test retrieving a book by its ID.
    Verify the API returns the book object with all required fields.
  related_code:
    - "src/controllers/books.ts[2-7]"
  test_category: "functional"
  tags: ["books", "get", "read"]
  priority: "high"

environment:
  host: "${API_HOST|localhost:3000}"
  scheme: "http"

variables:
  book_id: "${BOOK_ID|1}"

http:
  method: "GET"
  path: "/api/v1/books/${book_id}"
  headers:
    Accept: "application/json"

assertions:
  - type: "json_path"
    expression: "$.status"
    expected: 200
  - type: "json_path"
    expression: "$.body.id"
    operator: "exists"
  - type: "json_path"
    expression: "$.body.title"
    operator: "not_empty"
  - type: "response_time"
    max_ms: 1000
```

#### Generate Test for POST Endpoint

Given a controller with a POST endpoint:

```typescript
// src/controllers/users.ts
router.post('/api/v1/users', async (req, res) => {
  const { email, name, password } = req.body;
  if (!email || !name || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const user = await userService.create({ email, name, password });
  res.status(201).json(user);
});
```

Generate test file `create_user_success.http.tcase`:

```yaml
version: "1.0"
description: "Create a new user with valid data"

metadata:
  prompt: |
    Test creating a new user with valid email, name, and password.
    Verify the API returns 201 with the created user object.
  related_code:
    - "src/controllers/users.ts[2-9]"
    - "src/services/userService.ts"
  test_category: "functional"
  risk_level: "high"
  tags: ["users", "create", "post"]
  priority: "high"

environment:
  host: "${API_HOST|localhost:3000}"
  scheme: "http"

variables:
  unique_suffix: "${random_int(100000, 999999)}"
  test_email: "testuser${unique_suffix}@example.com"

http:
  method: "POST"
  path: "/api/v1/users"
  headers:
    Content-Type: "application/json"
    Accept: "application/json"
  body:
    json:
      email: "${test_email}"
      name: "Test User ${unique_suffix}"
      password: "SecurePass123!"

assertions:
  - type: "json_path"
    expression: "$.status"
    expected: 201
  - type: "json_path"
    expression: "$.body.id"
    operator: "exists"
  - type: "json_path"
    expression: "$.body.email"
    expected: "${test_email}"
  - type: "json_path"
    expression: "$.body.password"
    operator: "not_exists"
  - type: "response_time"
    max_ms: 2000

lifecycle:
  teardown:
    - action: "extract"
      scope: "assert"
      vars:
        created_user_id: "$.body.id"
```

### Git Diff Workflow

#### Step 1: Identify Changed Files

```bash
# Check what files changed
git diff --name-only

# Output:
# src/controllers/orders.ts
# src/services/orderService.ts
# src/routes/api.ts
```

#### Step 2: Analyze Changes

Read the changed files to understand what endpoints were added or modified.

#### Step 3: Generate Tests

For each new or modified endpoint, create a corresponding test file.

### Multiple Endpoints

#### Generate Suite for CRUD Operations

When a controller has multiple endpoints, generate a test file for each operation:

```
tests/orders/
├── create_order_success.http.tcase
├── create_order_validation_error.http.tcase
├── get_order_success.http.tcase
├── get_order_not_found.http.tcase
├── update_order_success.http.tcase
├── update_order_not_found.http.tcase
├── delete_order_success.http.tcase
└── delete_order_unauthorized.http.tcase
```

### Different Test Categories

#### Functional Test

```yaml
metadata:
  test_category: "functional"
  tags: ["orders", "create"]
```

#### Integration Test

```yaml
metadata:
  test_category: "integration"
  tags: ["orders", "payment", "inventory"]
  prompt: |
    Test the complete order flow including payment processing
    and inventory updates.
```

#### Security Test

```yaml
version: "1.0"
description: "Verify unauthorized access returns 401"

metadata:
  test_category: "security"
  risk_level: "critical"
  tags: ["auth", "security", "unauthorized"]

http:
  method: "GET"
  path: "/api/v1/admin/users"
  headers:
    Accept: "application/json"
    # No Authorization header

assertions:
  - type: "json_path"
    expression: "$.status"
    expected: 401
  - type: "json_path"
    expression: "$.body.error"
    operator: "exists"
```

#### Performance Test

```yaml
version: "1.0"
description: "Verify search endpoint responds within SLA"

metadata:
  test_category: "performance"
  tags: ["search", "performance", "sla"]
  timeout: "10s"

http:
  method: "GET"
  path: "/api/v1/products/search"
  query:
    q: "laptop"
    limit: 100

assertions:
  - type: "json_path"
    expression: "$.status"
    expected: 200
  - type: "response_time"
    max_ms: 500
  - type: "json_path"
    expression: "$.body.results"
    operator: "length_lte"
    expected: 100
```

### Edge Cases and Error Handling

#### Validation Error Test

```yaml
version: "1.0"
description: "Create user with invalid email returns 400"

metadata:
  related_code:
    - "src/controllers/users.ts[3-5]"
  test_category: "functional"
  tags: ["users", "validation", "error"]

http:
  method: "POST"
  path: "/api/v1/users"
  headers:
    Content-Type: "application/json"
  body:
    json:
      email: "invalid-email"
      name: "Test User"
      password: "password123"

assertions:
  - type: "json_path"
    expression: "$.status"
    expected: 400
  - type: "json_path"
    expression: "$.body.error"
    operator: "contains"
    expected: "email"
```

#### Not Found Test

```yaml
version: "1.0"
description: "Get non-existent book returns 404"

metadata:
  related_code:
    - "src/controllers/books.ts[4-6]"
  test_category: "functional"
  tags: ["books", "not-found", "error"]

http:
  method: "GET"
  path: "/api/v1/books/999999999"
  headers:
    Accept: "application/json"

assertions:
  - type: "json_path"
    expression: "$.status"
    expected: 404
  - type: "json_path"
    expression: "$.body.error"
    operator: "exists"
```

#### Conflict Test

```yaml
version: "1.0"
description: "Create duplicate email returns 409"

metadata:
  related_code:
    - "src/services/userService.ts[15-20]"
  test_category: "functional"
  tags: ["users", "conflict", "duplicate"]

variables:
  existing_email: "existing@example.com"

http:
  method: "POST"
  path: "/api/v1/users"
  headers:
    Content-Type: "application/json"
  body:
    json:
      email: "${existing_email}"
      name: "Duplicate User"
      password: "password123"

assertions:
  - type: "json_path"
    expression: "$.status"
    expected: 409
  - type: "json_path"
    expression: "$.body.error"
    operator: "contains"
    expected: "already exists"
```

### Complete Generation Workflow

#### From Git Diff to Tests

```bash
# 1. Check changes
git diff --name-only src/

# 2. Read changed files and generate tests
# (Assistant reads files and creates .tcase files)

# 3. Validate generated tests
tspec validate "tests/**/*.tcase"

# 4. Parse to verify structure
tspec parse "tests/**/*.tcase" -v

# 5. Run tests
tspec run "tests/**/*.tcase" -e API_HOST=localhost:3000
```

---

## 6. Coverage Examples

### Basic Coverage Analysis

#### Full Project Coverage

Analyze all tspec files against all source files:

```bash
# Step 1: Find all tspec files
# Using Glob: pattern="**/*.tcase"

# Step 2: Parse tspec files to extract metadata
tspec parse "tests/**/*.tcase" --output json

# Step 3: Find all source files
# Using Glob: pattern="**/*.{ts,js}"  path="src/"

# Step 4: Generate coverage report (manual comparison)
```

#### Sample Output

```markdown
# TSpec Coverage Report

Generated: 2024-01-15 10:30:00

## Summary

| Metric | Value |
|--------|-------|
| Total Source Files | 12 |
| Covered Files | 8 |
| Uncovered Files | 4 |
| File Coverage | 66.7% |
| Total TSpec Files | 15 |

## Uncovered Files

- src/utils/dateFormatter.ts
- src/utils/currencyFormatter.ts
- src/middleware/errorHandler.ts
- src/config/database.ts
```

### Directory-Scoped Analysis

#### Controllers Only

Focus coverage analysis on controller files:

```bash
# TSpec files for controllers
tests/controllers/**/*.tcase

# Source files to check
src/controllers/**/*.ts
```

#### Sample Controller Coverage Report

```markdown
# Controller Coverage Report

## Summary

| Metric | Value |
|--------|-------|
| Total Controllers | 5 |
| Covered Controllers | 4 |
| Coverage | 80.0% |

## File Coverage Details

| Controller | Status | Tests | Lines |
|------------|--------|-------|-------|
| books.ts | Covered | 4 | 1-120 |
| users.ts | Covered | 3 | 1-80 |
| orders.ts | Covered | 5 | 1-150 |
| auth.ts | Covered | 2 | 10-50 |
| admin.ts | Uncovered | 0 | - |
```

#### Services Coverage

```markdown
# Service Coverage Report

## Summary

| Metric | Value |
|--------|-------|
| Total Services | 6 |
| Covered Services | 3 |
| Coverage | 50.0% |

## Uncovered Services

- src/services/emailService.ts
- src/services/notificationService.ts
- src/services/cacheService.ts
```

### Line-Level Coverage Details

#### Detailed Line Analysis

```markdown
## Line Coverage: src/controllers/books.ts

Total lines: 150
Covered lines: 100-120 (estimated from ranges)
Coverage: ~75%

| Lines | TSpec File | Test Description |
|-------|------------|------------------|
| 5-25 | create_book_success.http.tcase | Create book with valid data |
| 5-25 | create_book_validation.http.tcase | Create book validation errors |
| 30-50 | get_book_success.http.tcase | Get book by ID |
| 30-50 | get_book_not_found.http.tcase | Get non-existent book |
| 55-75 | update_book_success.http.tcase | Update book details |
| 80-100 | delete_book_success.http.tcase | Delete book |
| 105-125 | list_books_paginated.http.tcase | List books with pagination |
| 130-150 | **UNCOVERED** | Search books endpoint |
```

#### Gap Identification

```markdown
## Coverage Gaps

### src/controllers/books.ts

**Untested code blocks:**
- Lines 130-150: Search functionality
  - Recommendation: Create `search_books.http.tcase`

### src/services/orderService.ts

**Untested code blocks:**
- Lines 80-120: Order cancellation logic
  - Recommendation: Create `cancel_order_*.http.tcase` tests
- Lines 150-180: Refund processing
  - Recommendation: Create `process_refund_*.http.tcase` tests
```

### Sample Complete Report

```markdown
# TSpec Coverage Report

Generated: 2024-01-15 14:22:00
Project: bookstore-api

## Executive Summary

| Metric | Value | Status |
|--------|-------|--------|
| File Coverage | 72.0% | Warning |
| Total Source Files | 25 | - |
| Covered Files | 18 | - |
| Uncovered Files | 7 | Action Needed |
| Total TSpec Files | 42 | - |

## Coverage by Directory

| Directory | Files | Covered | Coverage |
|-----------|-------|---------|----------|
| src/controllers/ | 5 | 5 | 100% |
| src/services/ | 8 | 5 | 62.5% |
| src/middleware/ | 4 | 2 | 50% |
| src/utils/ | 6 | 4 | 66.7% |
| src/routes/ | 2 | 2 | 100% |

## Detailed File Coverage

### Controllers (100% Covered)

| File | Tests | Lines Covered |
|------|-------|---------------|
| books.ts | 8 | 1-150 |
| users.ts | 6 | 1-120 |
| orders.ts | 10 | 1-200 |
| auth.ts | 4 | 1-80 |
| admin.ts | 3 | 1-60 |

### Services (62.5% Covered)

| File | Status | Tests | Lines |
|------|--------|-------|-------|
| bookService.ts | Covered | 4 | 1-100 |
| userService.ts | Covered | 3 | 1-80 |
| orderService.ts | Partial | 5 | 1-80 |
| authService.ts | Covered | 2 | 1-60 |
| paymentService.ts | Covered | 3 | 1-120 |
| emailService.ts | Uncovered | 0 | - |
| notificationService.ts | Uncovered | 0 | - |
| cacheService.ts | Uncovered | 0 | - |

## Uncovered Files (Priority Order)

### High Priority
- `src/services/emailService.ts` - Email notifications (security relevant)
- `src/middleware/rateLimiter.ts` - Rate limiting (security relevant)

### Medium Priority
- `src/services/notificationService.ts` - Push notifications
- `src/middleware/cors.ts` - CORS configuration

### Low Priority
- `src/utils/formatters.ts` - Utility functions
- `src/services/cacheService.ts` - Cache layer
- `src/utils/constants.ts` - Constant values

## Recommendations

1. **Immediate Action**: Create tests for `emailService.ts` and `rateLimiter.ts`
2. **Sprint Planning**: Add notification tests to backlog
3. **Tech Debt**: Utilities can be tested as part of integration tests

## Line Coverage Gaps

### src/services/orderService.ts (Partial Coverage)

| Section | Lines | Status | Action |
|---------|-------|--------|--------|
| Create order | 1-40 | Covered | - |
| Get order | 41-60 | Covered | - |
| Update order | 61-80 | Covered | - |
| Cancel order | 81-120 | Uncovered | Create test |
| Refund order | 121-160 | Uncovered | Create test |
| Order history | 161-200 | Covered | - |
```

### Interpreting Coverage Results

#### Good Coverage Indicators

- File coverage > 80%
- All controllers covered
- Critical services (auth, payment) fully covered
- No high-risk uncovered files

#### Warning Signs

- File coverage < 60%
- Security-related files uncovered
- Core business logic gaps
- Many partial coverage files

#### Action Items Based on Results

| Coverage Level | Action |
|----------------|--------|
| > 80% | Maintain, focus on edge cases |
| 60-80% | Target uncovered files in next sprint |
| 40-60% | Create test plan, prioritize critical paths |
| < 40% | Major test initiative needed |

### Integration with CI/CD

#### Coverage Gate Example

```yaml
# Example: Fail build if coverage drops below threshold
coverage-check:
  script: |
    # Generate coverage report
    # Parse summary metrics
    # Fail if coverage < 70%
```

#### Trend Tracking

Save reports with timestamps to track improvement:

```
reports/
├── coverage-2024-01-01.md
├── coverage-2024-01-08.md
├── coverage-2024-01-15.md
└── coverage-2024-01-22.md
```

---

## 7. Combined Workflows

### Complete Development Cycle

```bash
# 1. Generate tests from git changes
git diff --name-only src/
# (AI generates test files based on changes using tspec-gen)

# 2. Validate generated tests
tspec validate "tests/**/*.tcase"

# 3. Parse to inspect structure
tspec parse tests/new_endpoint.http.tcase -v

# 4. Run tests
tspec run "tests/**/*.tcase" -e API_HOST=localhost:3000

# 5. Analyze coverage
# (AI generates coverage report using tspec-coverage)
```

### CI/CD Pipeline Example

```yaml
# GitHub Actions
name: TSpec Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Verify TSpec
        run: npx @boolesai/tspec-cli list

      - name: Validate TSpec files
        run: npx @boolesai/tspec-cli validate "tests/**/*.tcase"

      - name: Run tests
        run: npx @boolesai/tspec-cli run "tests/**/*.tcase" --output json > results.json
        env:
          API_HOST: localhost:3000
```

### Pre-Release Checklist

```bash
# 1. Check protocol support
tspec list

# 2. Validate all tests
tspec validate "tests/**/*.tcase"

# 3. Run full test suite
tspec run "tests/**/*.tcase" --output json

# 4. Generate coverage report
# (AI analyzes related_code metadata)

# 5. Identify gaps and generate new tests if needed
# (AI creates new .tcase files for uncovered code)
```

### Debug a Failing Test

```bash
# 1. Parse to see resolved values
tspec parse tests/failing_test.http.tcase -v -e API_HOST=localhost

# 2. Run single test with verbose
tspec run tests/failing_test.http.tcase -v -c 1

# 3. Validate syntax if parse fails
tspec validate tests/failing_test.http.tcase
```
