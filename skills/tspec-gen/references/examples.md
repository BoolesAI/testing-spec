# TSpec Generate Examples

## Basic Examples

### Generate Test for GET Endpoint

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

### Generate Test for POST Endpoint

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

## Git Diff Workflow

### Step 1: Identify Changed Files

```bash
# Check what files changed
git diff --name-only

# Output:
# src/controllers/orders.ts
# src/services/orderService.ts
# src/routes/api.ts
```

### Step 2: Analyze Changes

Read the changed files to understand what endpoints were added or modified.

### Step 3: Generate Tests

For each new or modified endpoint, create a corresponding test file.

## Multiple Endpoints

### Generate Suite for CRUD Operations

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

## Different Test Categories

### Functional Test

```yaml
metadata:
  test_category: "functional"
  tags: ["orders", "create"]
```

### Integration Test

```yaml
metadata:
  test_category: "integration"
  tags: ["orders", "payment", "inventory"]
  prompt: |
    Test the complete order flow including payment processing
    and inventory updates.
```

### Security Test

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

### Performance Test

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

## Edge Cases and Error Handling

### Validation Error Test

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

### Not Found Test

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

### Conflict Test

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

## Complete Generation Workflow

### From Git Diff to Tests

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
