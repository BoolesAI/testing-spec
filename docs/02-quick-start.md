# 2. Quick Start

## Installation

```bash
npm install tspec-parser
```

## Your First Test Case

Create a file named `login_success.http.tspec`:

```yaml
version: "1.0"
description: "Verify successful login with valid credentials"

metadata:
  prompt: |
    Test that a user with valid username and password
    can successfully login and receive a JWT token.
  related_code:
    - "src/auth/login.js"
  test_category: "functional"
  risk_level: "high"
  tags: ["auth", "login", "smoke"]
  priority: "high"
  timeout: "10s"

environment:
  host: "${API_HOST|localhost:3000}"
  scheme: "http"

variables:
  username: "test_user"

http:
  method: "POST"
  path: "/api/auth/login"
  headers:
    Content-Type: "application/json"
  body:
    json:
      username: "${username}"
      password: "${env.TEST_PASSWORD}"

assertions:
  - type: "json_path"
    expression: "$.status"
    operator: "equals"
    expected: 200
  - type: "json_path"
    expression: "$.body.token"
    operator: "exists"
  - type: "response_time"
    max_ms: 1000

extract:
  token: "$.token"
```

## Running the Test

```javascript
import { generateTestCases, assertResults } from 'tspec-parser';

// 1. Generate test cases
const testCases = generateTestCases('./login_success.http.tspec', {
  env: { 
    API_HOST: 'localhost:3000',
    TEST_PASSWORD: 'secret123' 
  }
});

// 2. Execute the request (using your preferred HTTP client)
const response = await fetch(`http://${testCases[0].request._baseUrl}${testCases[0].request.path}`, {
  method: testCases[0].request.method,
  headers: testCases[0].request.headers,
  body: JSON.stringify(testCases[0].request.body.json)
});

const body = await response.json();

// 3. Assert results
const result = assertResults({
  statusCode: response.status,
  body: body,
  headers: Object.fromEntries(response.headers),
  responseTime: 150 // measured in ms
}, testCases[0]);

// 4. Check results
console.log('Passed:', result.passed);
console.log('Summary:', result.summary);
console.log('Extracted token:', result.extracted.token);
```

## Output

```
Passed: true
Summary: { total: 3, passed: 3, failed: 0, passRate: 100 }
Extracted token: eyJhbGciOiJIUzI1NiIs...
```

## Directory Structure

Recommended project structure:

```
my-service/
├── src/                          # Source code
├── api/
│   ├── contracts/                # OpenAPI / .proto files
│   ├── testcases/                # Test cases
│   │   ├── auth/
│   │   │   └── login/
│   │   │       ├── success.http.tspec
│   │   │       └── invalid_password.http.tspec
│   │   └── _templates/           # Templates
│   ├── datasets/                 # Test data (CSV, JSON, YAML)
│   └── suites/                   # Test suites
├── config/                       # Environment configs
└── scripts/                      # Execution scripts
```

## Next Steps

- [File Specification](./03-file-specification.md) - Naming conventions and format
- [Core Structure](./04-core-structure.md) - Top-level schema
- [Field Reference](./05-field-reference.md) - Detailed field definitions
- [Variables and Expressions](./06-variables-expressions.md) - Variable system
- [Assertions](./08-assertions.md) - Validation rules
- [Test Suites](./13-test-suites.md) - Organizing tests with suites
