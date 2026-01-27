# 9. Template Inheritance

TSpec supports template inheritance to reduce duplication and maintain consistency across test cases.

## Basic Usage

```yaml
extends: "_templates/base_http.yaml"
```

The `extends` field specifies a template file to inherit from. All fields from the template are merged with the current file.

## Template File Format

Templates are standard YAML files (not `.tspec`):

**_templates/base_http.yaml**:
```yaml
environment:
  scheme: "https"
  variables:
    api_version: "v1"

http:
  headers:
    Content-Type: "application/json"
    Accept: "application/json"

assertions:
  - type: "response_time"
    max_ms: 5000
```

## Merge Rules

### Scalar Values

Child values override parent values:

**Template**:
```yaml
environment:
  scheme: "https"
  host: "api.example.com"
```

**Test file**:
```yaml
extends: "template.yaml"
environment:
  host: "custom.api.com"  # Overrides template
```

**Result**:
```yaml
environment:
  scheme: "https"           # From template
  host: "custom.api.com"    # From test file (override)
```

### Arrays

Child arrays are appended to parent arrays:

**Template**:
```yaml
assertions:
  - type: "response_time"
    max_ms: 5000
```

**Test file**:
```yaml
extends: "template.yaml"
assertions:
  - type: "json_path"
    expression: "$.status"
    operator: "equals"
    expected: 200
```

**Result**:
```yaml
assertions:
  - type: "response_time"    # From template
    max_ms: 5000
  - type: "json_path"        # Appended from test file
    expression: "$.status"
    operator: "equals"
    expected: 200
```

### Maps (Objects)

Maps are deep merged:

**Template**:
```yaml
http:
  headers:
    Content-Type: "application/json"
    Accept: "application/json"
```

**Test file**:
```yaml
extends: "template.yaml"
http:
  headers:
    Authorization: "Bearer ${token}"
    Accept: "text/plain"  # Override
```

**Result**:
```yaml
http:
  headers:
    Content-Type: "application/json"   # From template
    Accept: "text/plain"               # Overridden
    Authorization: "Bearer ${token}"   # Added
```

## Replace Mode

Use `$replace: true` to completely replace instead of merge:

**Test file**:
```yaml
extends: "template.yaml"
assertions:
  $replace: true
  - type: "json_path"
    expression: "$.status"
    operator: "equals"
    expected: 201
```

This replaces all template assertions instead of appending.

## Multi-Level Inheritance

Templates can inherit from other templates:

**_templates/base.yaml**:
```yaml
environment:
  scheme: "https"
```

**_templates/base_auth.yaml**:
```yaml
extends: "../base.yaml"

http:
  headers:
    Authorization: "Bearer ${env.AUTH_TOKEN}"
```

**test.http.tspec**:
```yaml
extends: "_templates/base_auth.yaml"

# Inherits from both base.yaml and base_auth.yaml
```

**Inheritance chain**: `base.yaml` → `base_auth.yaml` → `test.http.tspec`

## Circular Dependency Protection

The parser detects and prevents circular dependencies:

```yaml
# a.yaml
extends: "b.yaml"

# b.yaml  
extends: "a.yaml"  # Error: Circular template dependency detected
```

## Template Organization

### Recommended Structure

```
_templates/
├── base.yaml                 # Common settings for all tests
├── base_http.yaml           # HTTP-specific defaults
├── base_grpc.yaml           # gRPC-specific defaults
├── auth/
│   ├── authenticated.yaml   # Tests requiring auth
│   └── admin.yaml          # Tests requiring admin auth
└── assertions/
    ├── common.yaml         # Common assertion definitions
    └── api_standards.yaml  # API standard assertions
```

### Base Template Example

**_templates/base_http.yaml**:
```yaml
environment:
  scheme: "${SCHEME|https}"
  host: "${API_HOST|api.example.com}"
  variables:
    api_version: "v1"

http:
  headers:
    Content-Type: "application/json"
    Accept: "application/json"
    X-Request-ID: "${uuid}"

assertions:
  - type: "response_time"
    max_ms: 5000
  - type: "json_path"
    expression: "$.header['Content-Type']"
    operator: "contains"
    expected: "application/json"
```

### Auth Template Example

**_templates/auth/authenticated.yaml**:
```yaml
extends: "../base_http.yaml"

http:
  headers:
    Authorization: "Bearer ${env.AUTH_TOKEN}"
```

### Using Templates

**testcases/users/get_profile.http.tspec**:
```yaml
version: "1.0"
description: "Get user profile"

metadata:
  prompt: "Test fetching authenticated user profile"
  related_code: ["src/controllers/user.controller.js"]
  test_category: "functional"
  risk_level: "medium"
  tags: ["user", "profile"]
  priority: "medium"
  timeout: "10s"

extends: "../../_templates/auth/authenticated.yaml"

http:
  method: "GET"
  path: "/api/${api_version}/users/me"

assertions:
  - type: "json_path"
    expression: "$.status"
    operator: "equals"
    expected: 200
  - type: "json_path"
    expression: "$.body.data.id"
    operator: "exists"
```

## Best Practices

### Keep Templates Focused

Create specific templates for specific purposes:

```yaml
# Good - focused templates
_templates/base_http.yaml      # HTTP defaults
_templates/auth/bearer.yaml    # Bearer token auth
_templates/auth/api_key.yaml   # API key auth

# Bad - one giant template
_templates/everything.yaml     # All settings mixed
```

### Use Relative Paths

```yaml
# From testcases/auth/login.http.tspec
extends: "../../_templates/base_http.yaml"
```

### Document Template Purpose

Add comments at the top of templates:

```yaml
# Base HTTP template
# Provides: default headers, response time assertion, JSON content type
# Requires: API_HOST environment variable
# 
environment:
  host: "${API_HOST}"
  ...
```

### Version Templates

For significant changes, consider versioning:

```
_templates/
├── v1/
│   └── base_http.yaml
└── v2/
    └── base_http.yaml
```
