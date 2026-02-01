# Test Suites

Test suites provide a way to organize related tests with shared configuration, lifecycle hooks, and hierarchical structure.

## Suite File Format

Suite files use the `.tsuite` extension with optional protocol prefix:

| Extension | Description |
|-----------|-------------|
| `*.http.tsuite` | HTTP test suite |
| `*.grpc.tsuite` | gRPC test suite |
| `*.graphql.tsuite` | GraphQL test suite |
| `*.ws.tsuite` | WebSocket test suite |
| `*.tsuite` | Mixed protocol suite |
| `*.tsuite.yaml` | Suite template |

## Basic Structure

```yaml
suite:
  name: "Bookstore API Tests"
  description: "End-to-end tests for the bookstore REST API"
  version: "1.0"
  
  metadata:
    prompt: "Test suite for bookstore API CRUD operations"
    tags: ["api", "bookstore", "integration"]
    test_category: "integration"
    risk_level: "high"
    priority: "high"
    
  environment:
    scheme: "http"
    host: "${API_HOST|localhost:3000}"
    
  variables:
    api_version: "v1"
    
  tests:
    - file: "create_book.http.tspec"
    - files: "books/**/*.http.tspec"
```

## Test References

### Single File

```yaml
tests:
  - file: "create_book.http.tspec"
```

### Glob Pattern

```yaml
tests:
  - files: "books/**/*.http.tspec"
```

### With Options

```yaml
tests:
  - file: "get_book.http.tspec"
    timeout: "10s"
    variables:
      book_id: "123"
  
  - files: "smoke/*.http.tspec"
    skip: false
    
  - files: "wip/*.http.tspec"
    skip: true
```

## Lifecycle Hooks

### Suite-Level Hooks

```yaml
suite:
  lifecycle:
    setup:
      # Runs once before all tests
      - action: "script"
        source: "scripts/setup-db.sh"
      - action: "http"
        request:
          method: "POST"
          path: "/test/seed"
          body:
            json:
              fixtures: ["users", "books"]
    teardown:
      # Runs once after all tests
      - action: "script"
        source: "scripts/cleanup-db.sh"
```

### Per-Test Hooks

```yaml
suite:
  before_each:
    # Runs before each test
    - action: "http"
      request:
        method: "POST"
        path: "/test/reset-state"
    - action: "extract"
      scope: "suite"
      vars:
        session_token: "$.token"
        
  after_each:
    # Runs after each test
    - action: "output"
      config:
        save_response_on_failure: true
```

### Lifecycle Action Types

| Action | Description | Required Fields |
|--------|-------------|-----------------|
| `script` | Execute shell script | `source` |
| `http` | Make HTTP request | `request.method`, `request.path` |
| `grpc` | Make gRPC call | `request.service`, `request.method` |
| `extract` | Extract variables | `vars` |
| `output` | Configure output | `config` |
| `wait` | Wait/delay | `duration` |
| `log` | Log message | `message` |

## Execution Configuration

```yaml
suite:
  execution:
    parallel_tests: true        # Run tests in parallel
    parallel_suites: false      # Run nested suites sequentially
    concurrency: 3              # Max concurrent items
    order: "defined"            # or "random"
    fail_fast: false            # Stop on first failure
    timeout: "10m"              # Suite-level timeout
    retry:
      count: 2
      delay: "2s"
      on_failure_only: true
```

## Nested Suites

```yaml
suite:
  name: "API Tests"
  
  tests:
    - files: "smoke/*.http.tspec"
    
  suites:
    - file: "auth/auth.http.tsuite"
    - file: "books/books.http.tsuite"
    - file: "orders/orders.http.tsuite"
```

## Suite Dependencies

```yaml
suite:
  name: "Order API Tests"
  depends_on:
    - "auth.http.tsuite"
    - "products.http.tsuite"
  
  tests:
    - file: "create_order.http.tspec"
```

## Suite Templates

### Template File (`*.tsuite.yaml`)

```yaml
# _templates/api-suite.tsuite.yaml
suite:
  environment:
    scheme: "http"
    host: "${API_HOST|localhost:3000}"
    
  variables:
    api_version: "v1"
    
  before_each:
    - action: "http"
      request:
        method: "POST"
        path: "/auth/token"
      extract:
        access_token: "$.token"
        
  execution:
    parallel_tests: false
    timeout: "5m"
```

### Extending Templates

```yaml
# books.http.tsuite
suite:
  name: "Book API Tests"
  extends: "_templates/api-suite.tsuite.yaml"
  
  variables:
    resource_path: "/api/v1/books"
    api_version: "v2"               # Override template
    
  tests:
    - file: "create_book.http.tspec"
```

## Variable Scoping

Variables are inherited and can be overridden at each level:

1. Global (environment variables)
2. Suite-level variables
3. Nested suite variables
4. Test-level variables
5. Data-driven variables (highest priority)

### Example

```yaml
# parent.tsuite
suite:
  name: "API Tests"
  variables:
    base_path: "/api/v1"
    timeout: "5000"
    
  suites:
    - file: "books/books.http.tsuite"
```

```yaml
# books/books.http.tsuite
suite:
  name: "Books"
  variables:
    base_path: "/api/v1/books"  # Override
    entity_name: "book"          # New variable
    
  tests:
    - file: "get_book.http.tspec"
      variables:
        book_id: "123"           # Test-specific
```

## CLI Usage

```bash
# Run single suite
tspec run bookstore.http.tsuite

# Run multiple suites
tspec run auth.tsuite books.tsuite

# Run with glob pattern
tspec run "tests/**/*.tsuite"

# Run with tag filter
tspec run --tag "smoke" "tests/**/*.tsuite"
```

## Suite Metadata

```yaml
suite:
  metadata:
    prompt: "AI context for test generation"
    related_code:
      - "src/controllers/books.ts"
      - "src/services/bookService.ts[10-50]"
    test_category: "integration"   # functional | integration | performance | security
    risk_level: "high"             # low | medium | high | critical
    tags: ["api", "books"]
    priority: "high"               # low | medium | high
    timeout: "5m"
    owner: "api-team"
```
