# TSpec Proxy Server

Demo implementation of a TSpec proxy server for remote test execution.

## Overview

This proxy server allows TSpec CLI and IDE integrations to execute tests remotely. It provides endpoints for:

- **POST /run** - Execute test cases and return results
- **POST /validate** - Validate test file schemas
- **POST /parse** - Parse test files and return structure

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Server port |
| `TSPEC_PROXY_TOKEN` | - | Bearer token for authentication (optional) |

### Client Configuration

Configure the TSpec CLI to use this proxy:

```json
{
  "proxy": {
    "url": "http://localhost:8080",
    "timeout": 60000,
    "headers": {
      "Authorization": "Bearer your-token"
    }
  }
}
```

Save this to `tspec.config.json` in your project root.

## API Reference

### POST /run

Execute test cases.

**Request:**
```json
{
  "files": ["tests/login.http.tcase"],
  "fileContents": {
    "tests/login.http.tcase": "version: \"1.0\"\n..."
  },
  "options": {
    "concurrency": 5,
    "env": { "API_HOST": "api.example.com" },
    "params": { "userId": "123" }
  }
}
```

**Response:**
```json
{
  "success": true,
  "results": [...],
  "summary": {
    "total": 10,
    "passed": 9,
    "failed": 1,
    "passRate": 90.0,
    "duration": 1234
  },
  "parseErrors": []
}
```

### POST /validate

Validate test files.

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
    { "file": "tests/login.http.tcase", "valid": true, "errors": [] }
  ],
  "summary": { "total": 1, "valid": 1, "invalid": 0 }
}
```

### POST /parse

Parse test files.

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
  "testCases": [...],
  "parseErrors": [],
  "summary": {
    "totalFiles": 1,
    "totalTestCases": 3,
    "parseErrors": 0
  }
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "version": "1.0.0"
}
```

## Security

### Authentication

Set `TSPEC_PROXY_TOKEN` environment variable to enable authentication:

```bash
TSPEC_PROXY_TOKEN=your-secret-token npm start
```

Clients must include the token in the `Authorization` header:

```
Authorization: Bearer your-secret-token
```

### Production Recommendations

- Always enable authentication in production
- Use HTTPS (deploy behind a reverse proxy like nginx)
- Implement rate limiting
- Use network policies to restrict access
