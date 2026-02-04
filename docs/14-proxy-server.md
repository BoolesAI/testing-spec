# 14. Proxy Server

TSpec supports remote execution of test operations through a proxy server. This allows you to offload test execution to a remote machine while maintaining the local CLI/IDE interface.

## Overview

The proxy feature enables:

- **Remote Execution**: Run tests on remote servers with access to target APIs
- **Centralized Testing**: Share a common test execution environment across teams
- **Resource Isolation**: Execute tests in controlled environments

```
┌─────────────────┐          ┌──────────────────┐          ┌─────────────────┐
│   CLI / VSCode  │          │  Proxy Client    │          │  Proxy Server   │
│                 │          │  (Local)         │          │  (Remote)       │
├─────────────────┤          ├──────────────────┤          ├─────────────────┤
│ tspec run       │──────────▶│ Check config    │          │                 │
│ tspec validate  │          │ If proxy:       │          │                 │
│ tspec parse     │          │   Forward HTTP  │──────────▶│ POST /run       │
│                 │          │ Else:           │          │ POST /validate  │
│                 │◀──────────│   Local exec    │◀──────────│ POST /parse     │
└─────────────────┘          └──────────────────┘          └─────────────────┘
```

## Configuration

### Configuration File

Add the `proxy` section to your `tspec.config.json`:

```json
{
  "proxy": {
    "url": "http://tspec-proxy.example.com:8080",
    "timeout": 60000,
    "headers": {
      "Authorization": "Bearer ${TSPEC_PROXY_TOKEN}"
    },
    "enabled": true,
    "operations": ["run", "validate", "parse"]
  }
}
```

### Configuration Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `url` | string | Yes | - | Proxy server URL (http or https) |
| `timeout` | number | No | 30000 | Request timeout in milliseconds |
| `headers` | object | No | {} | Custom HTTP headers (supports env variables) |
| `enabled` | boolean | No | true | Enable/disable proxy |
| `operations` | array | No | ["run", "validate", "parse"] | Operations to proxy |

### Configuration Hierarchy

1. **Global Config** (`~/.tspec/tspec.config.json`) - Organization-wide settings
2. **Local Config** (`./tspec.config.json`) - Project-specific overrides
3. **CLI Flags** - One-time overrides

Local config takes precedence over global. CLI flags take precedence over both.

### Environment Variables in Headers

Headers support environment variable expansion:

```json
{
  "proxy": {
    "url": "https://proxy.example.com",
    "headers": {
      "Authorization": "Bearer ${TSPEC_PROXY_TOKEN}",
      "X-Team-ID": "${TEAM_ID}"
    }
  }
}
```

## CLI Usage

### Run with Proxy

When proxy is configured, tests are automatically forwarded:

```bash
# Uses proxy if configured
tspec run tests/*.tcase

# Override proxy URL for single execution
tspec run tests/*.tcase --proxy-url http://localhost:8080

# Disable proxy for single execution
tspec run tests/*.tcase --no-proxy
```

### Validate with Proxy

```bash
# Validate through proxy
tspec validate tests/*.tcase

# Validate locally, bypass proxy
tspec validate tests/*.tcase --no-proxy
```

### Parse with Proxy

```bash
# Parse through proxy
tspec parse tests/*.tcase

# Parse locally
tspec parse tests/*.tcase --no-proxy
```

### CLI Flags

| Flag | Description |
|------|-------------|
| `--proxy-url <url>` | Override configured proxy URL |
| `--no-proxy` | Disable proxy for this execution |

## API Specification

All proxy endpoints accept POST requests with JSON payloads.

### POST /run

Execute test cases and return results.

**Request:**

```json
{
  "files": ["tests/login.http.tcase", "tests/logout.http.tcase"],
  "fileContents": {
    "tests/login.http.tcase": "version: \"1.0\"\ndescription: ...",
    "tests/logout.http.tcase": "version: \"1.0\"\ndescription: ..."
  },
  "options": {
    "concurrency": 5,
    "failFast": false,
    "env": {
      "API_HOST": "api.example.com"
    },
    "params": {
      "userId": "123"
    }
  }
}
```

**Response:**

```json
{
  "success": true,
  "results": [
    {
      "testCaseId": "login_success",
      "file": "tests/login.http.tcase",
      "passed": true,
      "duration": 245,
      "assertions": [
        {
          "type": "json_path",
          "passed": true,
          "message": "Status equals 200"
        }
      ]
    }
  ],
  "summary": {
    "total": 10,
    "passed": 9,
    "failed": 1,
    "skipped": 0,
    "passRate": 90.0,
    "duration": 3421
  },
  "parseErrors": []
}
```

### POST /validate

Validate test file schemas.

**Request:**

```json
{
  "files": ["tests/login.http.tcase"],
  "fileContents": {
    "tests/login.http.tcase": "version: \"1.0\"\n..."
  }
}
```

**Response:**

```json
{
  "success": true,
  "results": [
    {
      "file": "tests/login.http.tcase",
      "valid": true,
      "errors": []
    }
  ],
  "summary": {
    "total": 1,
    "valid": 1,
    "invalid": 0
  }
}
```

### POST /parse

Parse test files and return test case structure.

**Request:**

```json
{
  "files": ["tests/login.http.tcase"],
  "fileContents": {
    "tests/login.http.tcase": "version: \"1.0\"\n..."
  },
  "options": {
    "env": {},
    "params": {}
  }
}
```

**Response:**

```json
{
  "success": true,
  "testCases": [
    {
      "id": "login_success",
      "description": "Verify user login",
      "file": "tests/login.http.tcase",
      "protocol": "http",
      "assertions": [...]
    }
  ],
  "parseErrors": [],
  "summary": {
    "totalFiles": 1,
    "totalTestCases": 3,
    "parseErrors": 0
  }
}
```

### Error Response

All endpoints return errors in a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "PROXY_VALIDATION_ERROR",
    "message": "Invalid request payload",
    "details": "Missing required field: fileContents"
  }
}
```

**Error Codes:**

| Code | Description |
|------|-------------|
| `PROXY_CONNECTION_ERROR` | Cannot reach proxy server |
| `PROXY_TIMEOUT` | Request exceeded timeout |
| `PROXY_AUTH_ERROR` | Authentication failed (401/403) |
| `PROXY_VALIDATION_ERROR` | Invalid request payload |
| `PROXY_EXECUTION_ERROR` | Remote execution failed |

## Security

### Authentication

Use the `headers` configuration to add authentication:

```json
{
  "proxy": {
    "url": "https://proxy.example.com",
    "headers": {
      "Authorization": "Bearer ${TSPEC_PROXY_TOKEN}"
    }
  }
}
```

Store tokens in environment variables, never in config files committed to version control.

### HTTPS

Always use HTTPS in production:

```json
{
  "proxy": {
    "url": "https://tspec-proxy.internal.company.com"
  }
}
```

TSpec will warn if HTTP is used (except for localhost).

### Network Security

- Configure firewall rules to restrict access to proxy server
- Use VPN or private networks for internal proxy servers
- Implement IP whitelisting on the proxy server

## Implementing a Proxy Server

### Requirements

A TSpec proxy server must:

1. Accept POST requests at `/run`, `/validate`, `/parse`
2. Parse the request body as JSON
3. Write `fileContents` to temporary files
4. Execute corresponding TSpec operations
5. Return results in the specified format
6. Clean up temporary files

### Example Implementation

See the demo proxy server in `demo/proxy-server/` for a complete Express.js implementation.

**Basic structure:**

```typescript
import express from 'express';
import { parseTestCases, executeTestCase, validateTspec } from '@boolesai/tspec';

const app = express();
app.use(express.json({ limit: '100mb' }));

app.post('/run', async (req, res) => {
  const { files, fileContents, options } = req.body;
  
  // Write files to temp directory
  const tempDir = await writeTempFiles(fileContents);
  
  try {
    // Parse and execute tests
    const testCases = parseTestCases(files, options);
    const results = await executeTests(testCases, options);
    
    res.json({ success: true, results, summary: calculateSummary(results) });
  } finally {
    // Cleanup
    await cleanupTempDir(tempDir);
  }
});

app.listen(8080);
```

### Server Configuration

Recommended server settings:

```json
{
  "port": 8080,
  "host": "0.0.0.0",
  "auth": {
    "enabled": true,
    "tokens": ["token1", "token2"]
  },
  "limits": {
    "maxFileSize": "10MB",
    "maxFiles": 100,
    "requestTimeout": 120000
  }
}
```

## Troubleshooting

### Connection Refused

```
Error: PROXY_CONNECTION_ERROR - Connection refused
```

- Verify the proxy server is running
- Check the URL and port in configuration
- Verify network connectivity and firewall rules

### Authentication Failed

```
Error: PROXY_AUTH_ERROR - 401 Unauthorized
```

- Check that `TSPEC_PROXY_TOKEN` environment variable is set
- Verify the token is valid on the proxy server
- Check for token expiration

### Timeout

```
Error: PROXY_TIMEOUT - Request timeout after 30000ms
```

- Increase `timeout` in proxy configuration
- Check proxy server health and load
- Consider running fewer tests per request

### Certificate Error

```
Error: UNABLE_TO_VERIFY_LEAF_SIGNATURE
```

- For self-signed certificates, set `NODE_TLS_REJECT_UNAUTHORIZED=0` (development only)
- Install the CA certificate on the client machine
- Use a valid SSL certificate in production
