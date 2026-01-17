# 7. Data-Driven Testing

TSpec supports data-driven testing through external data sources. One test specification can generate multiple test cases based on data rows.

## Overview

```yaml
data:
  source: "datasets/login_cases.csv"
  driver: "parameterized"
  format: "csv"
```

When configured, the parser generates one test case per data row, with row values merged into variables.

## Configuration

### `source`

Path to the data file (relative to the test file location).

```yaml
data:
  source: "datasets/users.csv"           # Relative path
  source: "../shared/test_data.json"     # Parent directory
```

### `driver`

Data processing mode:

| Value | Description |
|-------|-------------|
| `parameterized` | Generate one test case per row |

```yaml
data:
  driver: "parameterized"
```

### `format`

Data file format (auto-detected from extension if not specified):

| Format | Extension | Description |
|--------|-----------|-------------|
| `csv` | `.csv` | Comma-separated values |
| `json` | `.json` | JSON array of objects |
| `yaml` | `.yaml`, `.yml` | YAML array of objects |

```yaml
data:
  format: "csv"
```

### `current_row`

For single-row mode, specify the row index (0-based):

```yaml
data:
  source: "datasets/users.csv"
  current_row: 0    # Use first data row only
```

## Data File Formats

### CSV Format

```csv
username,password,expected_status,expected_message
valid_user,correct_pass,200,Login successful
valid_user,wrong_pass,401,Invalid password
,correct_pass,400,Username required
locked_user,correct_pass,403,Account locked
```

**Rules**:
- First row is headers (become variable names)
- Empty values are preserved as empty strings
- Quoted values support commas: `"value, with comma"`

### JSON Format

```json
[
  {
    "username": "valid_user",
    "password": "correct_pass",
    "expected_status": 200,
    "expected_message": "Login successful"
  },
  {
    "username": "valid_user",
    "password": "wrong_pass",
    "expected_status": 401,
    "expected_message": "Invalid password"
  }
]
```

### YAML Format

```yaml
- username: valid_user
  password: correct_pass
  expected_status: 200
  expected_message: "Login successful"
  
- username: valid_user
  password: wrong_pass
  expected_status: 401
  expected_message: "Invalid password"
```

## Using Data Variables

Data columns become variables accessible via `${column_name}`:

```yaml
version: "1.0"
description: "Login test - data driven"

metadata:
  ai_prompt: "Test login with various credentials"
  related_code: ["src/auth/login.js"]
  test_category: "functional"
  risk_level: "high"
  tags: ["auth", "login", "data-driven"]
  priority: "high"
  timeout: "10s"

data:
  source: "datasets/login_cases.csv"
  driver: "parameterized"
  format: "csv"

http:
  method: "POST"
  path: "/api/auth/login"
  headers:
    Content-Type: "application/json"
  body:
    json:
      username: "${username}"        # From CSV column
      password: "${password}"        # From CSV column

assertions:
  - type: "status_code"
    expected: ${expected_status}     # From CSV column
  - type: "json_path"
    expression: "$.message"
    operator: "contains"
    expected: "${expected_message}"  # From CSV column
```

## Generated Test Cases

Given the CSV data:

```csv
username,password,expected_status
user1,pass1,200
user2,pass2,401
```

The parser generates two test cases:

```javascript
const testCases = generateTestCases('./login.http.tspec');

// testCases[0] - Row 0
{
  id: "login_row0",
  variables: { username: "user1", password: "pass1", expected_status: "200" },
  _dataRowIndex: 0,
  _dataRow: { username: "user1", password: "pass1", expected_status: "200" }
}

// testCases[1] - Row 1
{
  id: "login_row1",
  variables: { username: "user2", password: "pass2", expected_status: "401" },
  _dataRowIndex: 1,
  _dataRow: { username: "user2", password: "pass2", expected_status: "401" }
}
```

## Variable Priority with Data

When data variables conflict with other variables:

1. Input parameters (highest)
2. Environment variables
3. **Data row values**
4. Case-level variables
5. Template variables (lowest)

```yaml
variables:
  username: "default_user"    # Overridden by data row

data:
  source: "users.csv"         # username column overrides above
```

## Best Practices

### Organize Data Files

```
api/
├── testcases/
│   └── auth/
│       └── login.http.tspec
└── datasets/
    └── auth/
        ├── login_success.csv
        ├── login_failures.csv
        └── login_edge_cases.csv
```

### Use Meaningful Column Names

```csv
# Good - descriptive names
username,password,expected_status,expected_error_code

# Bad - unclear names
u,p,s,e
```

### Include Expected Values

Always include expected values in data for assertions:

```csv
input_amount,input_currency,expected_converted,expected_rate
100,USD,85.50,0.855
100,EUR,100.00,1.000
```

### Handle Edge Cases

```csv
username,password,scenario,expected_status
,validpass,empty_username,400
validuser,,empty_password,400
"user,name",validpass,username_with_comma,200
"user""name",validpass,username_with_quote,200
```

## Complete Example

**datasets/user_registration.csv**:
```csv
email,password,name,expected_status,expected_error
valid@example.com,SecurePass123!,Test User,201,
invalid-email,SecurePass123!,Test User,400,Invalid email format
valid2@example.com,weak,Test User,400,Password too weak
valid3@example.com,SecurePass123!,,400,Name required
```

**testcases/user/registration.http.tspec**:
```yaml
version: "1.0"
description: "User registration - data driven validation"

metadata:
  ai_prompt: |
    Test user registration endpoint with various input combinations.
    Validates both success and failure scenarios.
  related_code:
    - "src/controllers/user.controller.js"
  test_category: "functional"
  risk_level: "high"
  tags: ["user", "registration", "validation"]
  priority: "high"
  timeout: "10s"

data:
  source: "../datasets/user_registration.csv"
  driver: "parameterized"
  format: "csv"

http:
  method: "POST"
  path: "/api/v1/users"
  headers:
    Content-Type: "application/json"
  body:
    json:
      email: "${email}"
      password: "${password}"
      name: "${name}"

assertions:
  - type: "status_code"
    expected: ${expected_status}
  - type: "json_path"
    expression: "$.error"
    operator: "contains"
    expected: "${expected_error}"
```
