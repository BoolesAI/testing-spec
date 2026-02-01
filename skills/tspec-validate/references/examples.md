# TSpec Validate Examples

## Basic Validation

### Validate Single File

```bash
tspec validate tests/login_success.http.tcase
```

### Validate All Test Files

```bash
tspec validate "tests/**/*.tcase"
```

### Validate HTTP Tests Only

```bash
tspec validate "tests/**/*.http.tcase"
```

## Output Formats

### Text Output (Default)

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

### JSON Output

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

### Quiet Mode

```bash
tspec validate tests/*.tcase -q
```

Only outputs errors, no success messages.

## MCP Tool Examples

### Basic Validation

```json
{
  "files": ["tests/*.tcase"]
}
```

### JSON Output for Processing

```json
{
  "files": ["tests/**/*.http.tcase"],
  "output": "json"
}
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Validate TSpec files
  run: npx @boolesai/tspec-cli validate "tests/**/*.tcase"
```

### GitLab CI

```yaml
validate:
  stage: lint
  script:
    - npx @boolesai/tspec-cli validate "tests/**/*.tcase" --output json
```

### Pre-commit Hook

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

## Common Validation Errors

### Missing Required Field

```
Error: Missing required field 'version' at root level
```

Fix: Add `version: "1.0"` to the test file.

### Invalid HTTP Method

```
Error: Invalid HTTP method 'FETCH'. Expected one of: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
```

Fix: Use a valid HTTP method.

### Invalid Assertion Type

```
Error: Unknown assertion type 'body'. Use 'json_path' with expression "$.body.*" instead.
```

Fix: Use proper assertion syntax with valid types (`json_path`, `string`, `number`, `regex`, `xml_path`, `response_time`, `javascript`, `file_exist`, `file_read`, `exception`).

### Missing Protocol Block

```
Error: At least one protocol block (http, grpc) is required
```

Fix: Add an `http:` or `grpc:` block to the test file.

## Validate and Run Workflow

```bash
# Validate first, then run if valid
tspec validate tests/*.tcase && tspec run tests/*.tcase
```
