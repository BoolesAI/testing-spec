# TSpec Parse Examples

## Basic Parsing

### Parse Single File

```bash
tspec parse tests/login_success.http.tspec
```

### Parse Multiple Files

```bash
tspec parse "tests/**/*.tspec"
```

## Variable Substitution Debugging

### With Environment Variables

```bash
tspec parse tests/login.http.tspec -e API_HOST=localhost -e API_PORT=3000
```

### With Parameters

```bash
tspec parse tests/login.http.tspec -p username=testuser -p password=testpass
```

### Combined Environment and Parameters

```bash
tspec parse tests/login.http.tspec \
  -e API_HOST=localhost \
  -p username=testuser
```

## Output Formats

### Text Output (Default)

```bash
tspec parse tests/login.http.tspec
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

### Verbose Output

```bash
tspec parse tests/login.http.tspec -v
```

Includes:
- Full metadata
- Variable resolution trace
- Template inheritance chain
- All headers (including defaults)

### JSON Output

```bash
tspec parse tests/login.http.tspec --output json
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

## MCP Tool Examples

### Basic Parse

```json
{
  "files": ["tests/login.http.tspec"]
}
```

### Parse with Variables

```json
{
  "files": ["tests/login.http.tspec"],
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

### JSON Output for Processing

```json
{
  "files": ["tests/*.tspec"],
  "output": "json"
}
```

## Debugging Workflows

### Debug Unresolved Variables

```bash
# See which variables couldn't be resolved
tspec parse tests/login.http.tspec -v 2>&1 | grep -i "unresolved"
```

### Compare Variable Resolution

```bash
# Development environment
tspec parse tests/api.http.tspec -e API_HOST=localhost

# Production environment
tspec parse tests/api.http.tspec -e API_HOST=api.example.com
```

### Inspect Template Inheritance

```bash
# See how base template merges with test
tspec parse tests/auth_with_base.http.tspec -v
```

## Data-Driven Test Inspection

### View Expanded Test Cases

```bash
tspec parse tests/login_data_driven.http.tspec -v
```

Shows all test case variations from CSV/JSON data sources.

## Parse Before Run Workflow

```bash
# 1. Parse to verify request looks correct
tspec parse tests/new_test.http.tspec -v

# 2. If satisfied, run the test
tspec run tests/new_test.http.tspec
```

## Quiet Mode

```bash
tspec parse tests/*.tspec -q
```

Minimal output, only shows essential information or errors.
