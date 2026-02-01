---
name: tspec-gen
description: Generate TSpec test cases from code changes. Use for creating tests from git diff, file changes, or new endpoints. Keywords: generate tests, create tspec, code to test, git diff tests, new endpoint tests, auto generate, test generation
---

# TSpec Generate

## Overview

Generate TSpec test cases from source code changes. This skill guides you through analyzing code (from git diff or explicit file paths) and creating corresponding `.tcase` test files with proper structure, metadata, and assertions.

Use this skill when:
- New API endpoints are added
- Existing endpoint behavior changes
- You need to create test cases for uncovered code
- You want to generate tests from git diff changes

## Input Sources

### Git Diff (Recommended)

Detect changed files automatically using git:

```bash
# View changed files
git diff --name-only

# View staged changes
git diff --cached --name-only

# View changes between branches
git diff main...HEAD --name-only
```

### Explicit File Paths

Specify source files directly when you know which code needs tests.

## Workflow

1. **Identify Target Code**
   - Use git diff to find changed files, OR
   - Accept explicit file paths from user

2. **Analyze Source Code**
   - Read the source file(s)
   - Identify endpoints, methods, functions
   - Understand request/response structure
   - Note validation rules and error cases

3. **Generate TSpec File(s)**
   - Create `.tcase` file with proper naming
   - Populate all required fields
   - Add `metadata.related_code` pointing to source

4. **Validate Generated Tests**
   - Use `tspec validate` to check syntax
   - Use `tspec parse` to verify structure

## TSpec File Template

```yaml
version: "1.0"
description: "<Clear description of what this test verifies>"

metadata:
  prompt: |
    <Natural language description for AI context>
  related_code:
    - "<source_file_path>"
    - "<source_file_path>[<line_number>]"
    - "<source_file_path>[<start>-<end>]"
  test_category: "<functional|integration|performance|security>"
  risk_level: "<low|medium|high|critical>"
  tags: ["<tag1>", "<tag2>"]
  priority: "<low|medium|high>"
  timeout: "<duration>"

environment:
  name: "${ENV_NAME|local}"
  host: "${API_HOST|localhost:3000}"
  scheme: "http"

variables:
  # Define test-specific variables
  var_name: "${function()}"

http:
  method: "<GET|POST|PUT|DELETE|PATCH>"
  path: "<endpoint_path>"
  headers:
    Content-Type: "application/json"
    Accept: "application/json"
  body:
    json:
      # Request body fields

assertions:
  - type: "json_path"
    expression: "$.status"
    expected: <status_code>
  - type: "json_path"
    expression: "$.body.<field>"
    operator: "<operator>"
    expected: "<value>"
  - type: "response_time"
    max_ms: <milliseconds>

lifecycle:
  teardown:
    - action: "extract"
      scope: "assert"
      vars:
        extracted_var: "$.body.<field>"
```

## Generation Guidelines

### File Naming

Pattern: `{scenario}_{description}.{protocol}.tcase`

Examples:
- `create_user_success.http.tcase`
- `get_book_not_found.http.tcase`
- `update_order_validation_error.http.tcase`
- `delete_product_unauthorized.http.tcase`

### Metadata Fields

| Field | When to Use |
|-------|-------------|
| `prompt` | Always - describe test purpose for AI context |
| `related_code` | Always - link to source files/lines |
| `test_category` | Always - classify test type |
| `risk_level` | High-risk endpoints (payments, auth, data mutation) |
| `tags` | Always - enable filtering and grouping |
| `priority` | Critical paths or frequently used endpoints |
| `timeout` | Slow endpoints or performance-sensitive tests |

### related_code Format

```yaml
related_code:
  # Entire file
  - "src/controllers/userController.ts"
  
  # Specific line
  - "src/services/authService.ts[42]"
  
  # Line range
  - "src/routes/api.ts[10-25]"
  
  # Multiple references in one file
  - "src/utils/validation.ts[1,15-20,45]"
```

### Test Categories

| Category | Use When |
|----------|----------|
| `functional` | Testing endpoint behavior, CRUD operations |
| `integration` | Testing multiple services together |
| `performance` | Response time, load testing |
| `security` | Authentication, authorization, input validation |

### Common Assertion Patterns

**Status Code:**
```yaml
- type: "json_path"
  expression: "$.status"
  expected: 200
```

**Field Existence:**
```yaml
- type: "json_path"
  expression: "$.body.id"
  operator: "exists"
```

**Field Value:**
```yaml
- type: "json_path"
  expression: "$.body.name"
  expected: "Expected Name"
```

**Pattern Matching:**
```yaml
- type: "json_path"
  expression: "$.body.email"
  operator: "matches"
  pattern: "^[\\w.-]+@[\\w.-]+\\.\\w+$"
```

**Array Length:**
```yaml
- type: "json_path"
  expression: "$.body.items"
  operator: "length_gte"
  expected: 1
```

**Response Time:**
```yaml
- type: "response_time"
  max_ms: 2000
```

### Variable Patterns

```yaml
variables:
  # Random values for unique data
  random_id: "${uuid}"
  random_num: "${random_int(1000, 9999)}"
  
  # Timestamps
  current_time: "${timestamp}"
  formatted_date: "${now(yyyy-MM-dd)}"
  
  # Environment-based
  api_key: "${env.API_KEY}"
  base_url: "${API_HOST|localhost}"
```

## Common Use Cases

### Generate Tests from New Controller

1. Read the controller file
2. Identify all route handlers
3. For each handler, create:
   - Success case test
   - Validation error test (if applicable)
   - Not found test (if applicable)
   - Authorization test (if protected)

### Generate Tests from Git Diff

1. Run `git diff --name-only` to get changed files
2. Filter for relevant source files (controllers, routes, services)
3. Read each changed file
4. Identify new or modified endpoints
5. Generate corresponding test files

### Generate Error Handling Tests

For each endpoint, consider:
- Invalid input data (400 Bad Request)
- Missing authentication (401 Unauthorized)
- Insufficient permissions (403 Forbidden)
- Resource not found (404 Not Found)
- Conflict states (409 Conflict)
- Server errors (500 Internal Server Error)

## Post-Generation Steps

After generating test files:

1. **Validate syntax:**
   ```bash
   tspec validate "tests/*.tcase"
   ```

2. **Parse and inspect:**
   ```bash
   tspec parse "tests/*.tcase" -v
   ```

3. **Run tests:**
   ```bash
   tspec run "tests/*.tcase" -e API_HOST=localhost
   ```

## Related Skills

- [tspec-validate](../tspec-validate/SKILL.md) - Validate generated test files
- [tspec-parse](../tspec-parse/SKILL.md) - Inspect test structure
- [tspec-run](../tspec-run/SKILL.md) - Execute generated tests
- [tspec-coverage](../tspec-coverage/SKILL.md) - Analyze test coverage
