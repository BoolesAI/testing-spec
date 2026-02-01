# 3. File Specification

## File Types

TSpec supports two file types: test case files (`.tcase`) and test suite files (`.tsuite`).

### Test Case Files (`.tcase`)

Individual test case files use the `.tcase` extension with a protocol identifier:

| Extension | Protocol | Description |
|-----------|----------|-------------|
| `.http.tcase` | HTTP/HTTPS | REST API tests |
| `.grpc.tcase` | gRPC | gRPC service tests |
| `.graphql.tcase` | GraphQL | GraphQL API tests (reserved) |
| `.websocket.tcase` | WebSocket | WebSocket tests (reserved) |

### Test Suite Files (`.tsuite`)

Test suite files organize related tests with shared configuration:

| Extension | Description |
|-----------|-------------|
| `*.http.tsuite` | HTTP test suite |
| `*.grpc.tsuite` | gRPC test suite |
| `*.graphql.tsuite` | GraphQL test suite (reserved) |
| `*.ws.tsuite` | WebSocket test suite (reserved) |
| `*.tsuite` | Mixed protocol suite |
| `*.tsuite.yaml` | Suite template |

See [Test Suites](./13-test-suites.md) for complete suite documentation.

## Naming Convention

### Test Case Files

**Pattern**: `{business_scenario}_{test_type}_{description}.{protocol}.tcase`

#### Examples

```
login_functional_success.http.tcase
login_functional_invalid_password.http.tcase
user_integration_create_and_delete.http.tcase
payment_security_sql_injection.http.tcase
order_performance_bulk_create.grpc.tcase
```

### Test Suite Files

**Pattern**: `{domain}.{protocol}.tsuite` or `{domain}_{description}.{protocol}.tsuite`

#### Examples

```
auth.http.tsuite
bookstore.http.tsuite
user_api.http.tsuite
order_service.grpc.tsuite
api.tsuite                     # Mixed protocol
```

### Components

| Component | Description | Examples |
|-----------|-------------|----------|
| `business_scenario` | Business domain or feature | `login`, `user`, `payment`, `order` |
| `test_type` | Type of test | `functional`, `integration`, `performance`, `security` |
| `description` | Brief description | `success`, `invalid_password`, `timeout` |
| `protocol` | Communication protocol | `http`, `grpc`, `graphql` |

## Encoding

- **Character Encoding**: UTF-8 (mandatory)
- **Line Endings**: LF (Unix-style) recommended
- **BOM**: Not allowed

## YAML Syntax Rules

TSpec uses YAML 1.2 with the following conventions:

### Indentation

- Use **2 spaces** for indentation (no tabs)
- Consistent indentation throughout the file

```yaml
# Good
http:
  method: "POST"
  headers:
    Content-Type: "application/json"

# Bad (inconsistent indentation)
http:
    method: "POST"
  headers:
      Content-Type: "application/json"
```

### String Quoting

- Always quote strings that could be misinterpreted
- Use double quotes for strings containing variables

```yaml
# Good
version: "1.0"
path: "/api/users/${user_id}"

# Potentially problematic
version: 1.0        # Interpreted as float
path: /api/users    # Works but inconsistent
```

### Multi-line Strings

Use `|` for multi-line strings (preserves newlines):

```yaml
metadata:
  prompt: |
    This is a multi-line prompt.
    It preserves line breaks.
    Each line is separate.
```

Use `>` for folded strings (converts newlines to spaces):

```yaml
description: >
  This is a long description that
  will be folded into a single line
  with spaces between parts.
```

### Comments

- Use `#` for comments
- Place comments above the field they describe
- Use comments only for non-obvious logic

```yaml
# Authentication test for OAuth 2.0 flow
# Related ticket: AUTH-123
version: "1.0"

metadata:
  # This prompt guides AI generation
  prompt: |
    Test the OAuth token refresh flow...
```

### Prohibited Patterns

Avoid inline complex expressions:

```yaml
# Bad - inline complex structure
headers: { Content-Type: "application/json", Authorization: "Bearer ${token}" }

# Good - explicit structure
headers:
  Content-Type: "application/json"
  Authorization: "Bearer ${token}"
```

## File Organization

### Single Test Per File

Each `.tcase` file should contain exactly one test case. For data-driven tests, the data source generates multiple test instances from a single file.

### Related Tests Together

Group related tests in directories:

```
testcases/
├── auth/
│   ├── auth.http.tsuite              # Suite for auth tests
│   ├── login/
│   │   ├── success.http.tcase
│   │   ├── invalid_password.http.tcase
│   │   ├── locked_account.http.tcase
│   │   └── rate_limited.http.tcase
│   └── logout/
│       └── success.http.tcase
├── users/
│   ├── users.http.tsuite             # Suite for user tests
│   ├── create.http.tcase
│   ├── read.http.tcase
│   ├── update.http.tcase
│   └── delete.http.tcase
├── _templates/
│   ├── base_http.yaml
│   ├── base_auth.yaml
│   └── api-suite.tsuite.yaml         # Suite template
└── api.tsuite                        # Root suite
```

### Template Organization

Place templates in a `_templates` directory (underscore prefix prevents confusion with test files):

```
_templates/
├── base_http.yaml        # Base HTTP configuration
├── base_auth.yaml        # Authentication defaults
├── base_grpc.yaml        # Base gRPC configuration
├── api-suite.tsuite.yaml # Suite template
└── assertions/
    └── common.yaml       # Reusable assertion definitions
```
