# 3. File Specification

## File Extension

TSpec files use the `.tspec` extension with a protocol identifier:

| Extension | Protocol | Description |
|-----------|----------|-------------|
| `.http.tspec` | HTTP/HTTPS | REST API tests |
| `.grpc.tspec` | gRPC | gRPC service tests |
| `.graphql.tspec` | GraphQL | GraphQL API tests (reserved) |
| `.websocket.tspec` | WebSocket | WebSocket tests (reserved) |

## Naming Convention

**Pattern**: `{business_scenario}_{test_type}_{description}.{protocol}.tspec`

### Examples

```
login_functional_success.http.tspec
login_functional_invalid_password.http.tspec
user_integration_create_and_delete.http.tspec
payment_security_sql_injection.http.tspec
order_performance_bulk_create.grpc.tspec
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
  ai_prompt: |
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
  ai_prompt: |
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

Each `.tspec` file should contain exactly one test case. For data-driven tests, the data source generates multiple test instances from a single file.

### Related Tests Together

Group related tests in directories:

```
testcases/
├── auth/
│   ├── login/
│   │   ├── success.http.tspec
│   │   ├── invalid_password.http.tspec
│   │   ├── locked_account.http.tspec
│   │   └── rate_limited.http.tspec
│   └── logout/
│       └── success.http.tspec
├── users/
│   ├── create.http.tspec
│   ├── read.http.tspec
│   ├── update.http.tspec
│   └── delete.http.tspec
└── _templates/
    ├── base_http.yaml
    └── base_auth.yaml
```

### Template Organization

Place templates in a `_templates` directory (underscore prefix prevents confusion with test files):

```
_templates/
├── base_http.yaml        # Base HTTP configuration
├── base_auth.yaml        # Authentication defaults
├── base_grpc.yaml        # Base gRPC configuration
└── assertions/
    └── common.yaml       # Reusable assertion definitions
```
