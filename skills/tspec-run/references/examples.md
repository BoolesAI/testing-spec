# TSpec Run Examples

## Basic Examples

### Run Single Test File

```bash
tspec run tests/login_success.http.tspec
```

### Run All HTTP Tests

```bash
tspec run "tests/**/*.http.tspec"
```

### Run All Tests with Glob Pattern

```bash
tspec run "tests/*.tspec"
```

## Environment Variables

### Single Environment Variable

```bash
tspec run tests/*.tspec -e API_HOST=localhost
```

### Multiple Environment Variables

```bash
tspec run tests/*.tspec \
  -e API_HOST=api.example.com \
  -e API_KEY=secret123 \
  -e API_PORT=8080
```

### MCP Tool with Environment

```json
{
  "files": ["tests/*.tspec"],
  "env": {
    "API_HOST": "api.example.com",
    "API_KEY": "secret123",
    "API_PORT": "8080"
  }
}
```

## Parameters

### Pass Test Parameters

```bash
tspec run tests/*.tspec -p username=testuser -p password=testpass
```

### MCP Tool with Parameters

```json
{
  "files": ["tests/login.http.tspec"],
  "params": {
    "username": "testuser",
    "password": "testpass"
  }
}
```

## Concurrency Control

### Run with Higher Concurrency

```bash
tspec run tests/*.tspec -c 10
```

### Run Tests Sequentially

```bash
tspec run tests/*.tspec -c 1
```

## Output Formats

### JSON Output for CI/CD

```bash
tspec run tests/*.tspec --output json
```

### Verbose Text Output

```bash
tspec run tests/*.tspec -v
```

### Quiet Mode (Summary Only)

```bash
tspec run tests/*.tspec -q
```

## Failure Handling

### Stop on First Failure

```bash
tspec run tests/*.tspec --fail-fast
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Run TSpec tests
  run: |
    npx @boolesai/tspec-cli run tests/*.tspec --output json > results.json
```

### GitLab CI

```yaml
test:
  script:
    - npx @boolesai/tspec-cli run tests/*.tspec --output json
  artifacts:
    reports:
      junit: results.json
```

## Combined Examples

### Full CI/CD Run

```bash
tspec run "tests/**/*.tspec" \
  -e API_HOST=staging.example.com \
  -e API_KEY=$API_KEY \
  -c 10 \
  --output json \
  --fail-fast
```

### Debug Run with Verbose Output

```bash
tspec run tests/failing_test.http.tspec \
  -v \
  -e DEBUG=true \
  -c 1
```
