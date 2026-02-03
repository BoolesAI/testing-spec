# TSpec HTTP Protocol Plugin

HTTP/HTTPS protocol plugin for [TSpec](https://github.com/boolesai/testing-spec) - enables REST API testing and HTTP endpoint validation.

## Features

- ✅ **Full HTTP/HTTPS Support**: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
- 🔒 **Authentication**: Bearer tokens, API keys, custom headers
- 📦 **Multiple Body Formats**: JSON, form data, text, binary
- 🔄 **Request/Response Handling**: Query parameters, headers, cookies
- ⚡ **Configurable Options**: Timeouts, redirects, retry logic
- 🎯 **JSONPath Assertions**: Validate response structure and values
- 🌐 **Base URL Configuration**: Centralized endpoint management

## Installation

### Using TSpec CLI (Recommended)

```bash
tspec plugin:install @boolesai/tspec-plugin-http
```

### Manual Installation

```bash
npm install --save-dev @boolesai/tspec-plugin-http
```

Then add to your `tspec.config.json`:

```json
{
  "plugins": ["@boolesai/tspec-plugin-http"]
}
```

## Usage

### Basic Example

Create a test case file `login.http.tcase`:

```yaml
version: "1.0"
description: "Test user login API"

http:
  method: "POST"
  path: "/api/v1/auth/login"
  headers:
    Content-Type: "application/json"
  body:
    username: "test_user"
    password: "password123"

assertions:
  - type: "json_path"
    expression: "$.success"
    operator: "equals"
    expected: true
  - type: "json_path"
    expression: "$.token"
    operator: "exists"
```

Run the test:

```bash
tspec run login.http.tcase
```

### Common Use Cases

#### GET Request with Query Parameters

```yaml
http:
  method: "GET"
  path: "/api/users"
  query:
    page: "1"
    limit: "10"
    sort: "name"

assertions:
  - type: "json_path"
    expression: "$.data.length"
    operator: "equals"
    expected: 10
```

#### Authenticated Request

```yaml
http:
  method: "GET"
  path: "/api/profile"
  headers:
    Authorization: "Bearer ${ACCESS_TOKEN}"

assertions:
  - type: "json_path"
    expression: "$.status"
    operator: "equals"
    expected: 200
```

#### POST with JSON Body

```yaml
http:
  method: "POST"
  path: "/api/users"
  headers:
    Content-Type: "application/json"
  body:
    name: "John Doe"
    email: "john@example.com"
    role: "admin"

assertions:
  - type: "json_path"
    expression: "$.id"
    operator: "exists"
```

#### File Upload

```yaml
http:
  method: "POST"
  path: "/api/upload"
  headers:
    Content-Type: "multipart/form-data"
  body:
    file: "@/path/to/file.pdf"
    description: "Document upload"
```

## Configuration

Configure plugin behavior in `tspec.config.json`:

```json
{
  "plugins": ["@boolesai/tspec-plugin-http"],
  "pluginOptions": {
    "@boolesai/tspec-plugin-http": {
      "baseURL": "https://api.example.com",
      "timeout": 30000,
      "followRedirects": true,
      "maxRedirects": 5,
      "validateStatus": null,
      "headers": {
        "User-Agent": "TSpec/1.0",
        "Accept": "application/json"
      }
    }
  }
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `baseURL` | `string` | - | Base URL prepended to all paths |
| `timeout` | `number` | `30000` | Request timeout in milliseconds |
| `followRedirects` | `boolean` | `true` | Follow HTTP redirects |
| `maxRedirects` | `number` | `5` | Maximum redirect count |
| `validateStatus` | `function` | - | Custom status validation function |
| `headers` | `object` | `{}` | Default headers for all requests |
| `maxContentLength` | `number` | - | Maximum response body size |
| `maxBodyLength` | `number` | - | Maximum request body size |

## Request Schema

The HTTP request block supports the following fields:

```yaml
http:
  method: string          # Required: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
  path: string           # Required: Request path or full URL
  headers: object        # Optional: Request headers
  query: object          # Optional: Query string parameters
  body: object | string  # Optional: Request body (JSON, text, or form data)
  timeout: number        # Optional: Override default timeout
```

## Response Structure

The plugin returns responses in the following format:

```typescript
{
  protocol: 'http' | 'https',
  statusCode: number,
  headers: Record<string, string>,
  body: any,
  duration: number,
  url: string,
  method: string
}
```

## Environment Variables

Use environment variables in test cases:

```yaml
http:
  method: "POST"
  path: "/api/login"
  body:
    username: "${TEST_USERNAME}"
    password: "${TEST_PASSWORD}"
```

Set via command line:

```bash
tspec run --env TEST_USERNAME=admin --env TEST_PASSWORD=secret login.http.tcase
```

Or in a `.env` file:

```env
TEST_USERNAME=admin
TEST_PASSWORD=secret
API_BASE_URL=https://api.example.com
```

## Advanced Features

### Template Inheritance

Reuse common configurations:

```yaml
# base-api.http.tcase
version: "1.0"
description: "Base API configuration"
template: true

http:
  headers:
    Authorization: "Bearer ${API_TOKEN}"
    Content-Type: "application/json"
```

```yaml
# create-user.http.tcase
version: "1.0"
description: "Create new user"
extends: "base-api.http.tcase"

http:
  method: "POST"
  path: "/api/users"
  body:
    name: "Jane Doe"
```

### Data-Driven Testing

Run the same test with multiple data sets:

```yaml
version: "1.0"
description: "Test multiple user logins"

data:
  - username: "admin"
    password: "admin123"
  - username: "user"
    password: "user123"

http:
  method: "POST"
  path: "/api/login"
  body:
    username: "${username}"
    password: "${password}"

assertions:
  - type: "json_path"
    expression: "$.success"
    operator: "equals"
    expected: true
```

### Chaining Requests

Use outputs from one request in another:

```yaml
# First test case - login and save token
version: "1.0"
description: "Login and extract token"

http:
  method: "POST"
  path: "/api/login"
  body:
    username: "admin"
    password: "admin123"

outputs:
  auth_token:
    json_path: "$.token"
```

```yaml
# Second test case - use saved token
version: "1.0"
description: "Get user profile"

http:
  method: "GET"
  path: "/api/profile"
  headers:
    Authorization: "Bearer ${auth_token}"
```

## Examples

See the [demo](../../demo/test) directory for more examples:

- [create_book.http.tcase](../../demo/test/create_book.http.tcase)
- [get_book.http.tcase](../../demo/test/get_book.http.tcase)
- [list_books.http.tcase](../../demo/test/list_books.http.tcase)

## Troubleshooting

### Connection Errors

```bash
# Check if the API is accessible
curl -v https://api.example.com/health

# Test with increased timeout
tspec run --plugin-options='{"@boolesai/tspec-plugin-http":{"timeout":60000}}' test.http.tcase
```

### SSL/TLS Issues

```json
{
  "pluginOptions": {
    "@boolesai/tspec-plugin-http": {
      "rejectUnauthorized": false
    }
  }
}
```

### Debug Mode

Enable detailed logging:

```bash
DEBUG=tspec:* tspec run test.http.tcase
```

## API Reference

### HttpRunner

```typescript
import { HttpRunner } from '@boolesai/tspec-plugin-http';

const runner = new HttpRunner({
  baseURL: 'https://api.example.com',
  timeout: 30000
});

const response = await runner.execute(testCase);
```

### Request Builder

```typescript
import { buildAxiosConfig, buildUrl } from '@boolesai/tspec-plugin-http';

const config = buildAxiosConfig(request, options);
const url = buildUrl(baseURL, path, query);
```

## Contributing

Contributions are welcome! Please see the [Plugin Development Guide](../DEVELOPMENT.md) for details.

## License

MIT License - see [LICENSE](../../LICENSE) for details.

## Related

- [TSpec Core](../../core/README.md)
- [TSpec CLI](../../cli/README.md)
- [Plugin Development Guide](../DEVELOPMENT.md)
- [Web Plugin](../tspec-protocol-web/README.md)
- [Full Documentation](https://tspec.boolesai.com)
