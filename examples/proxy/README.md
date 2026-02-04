# TSpec Proxy Configuration Example

This example demonstrates how to configure TSpec to use a remote proxy server for test execution.

## Setup

### 1. Start the Proxy Server

First, start the demo proxy server:

```bash
cd demo/proxy-server
npm install
npm run dev
```

The server will start at `http://localhost:8080`.

### 2. Configure TSpec

Copy `tspec.config.json` to your project root:

```bash
cp examples/proxy/tspec.config.json ./tspec.config.json
```

### 3. Set Authentication Token (Optional)

If the proxy server requires authentication:

```bash
export TSPEC_PROXY_TOKEN=your-secret-token
```

### 4. Run Tests

```bash
# Tests will be executed via proxy
tspec run tests/*.tcase

# Disable proxy for single execution
tspec run tests/*.tcase --no-proxy

# Override proxy URL
tspec run tests/*.tcase --proxy-url http://remote-server:8080
```

## Configuration Options

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `url` | string | Yes | - | Proxy server URL |
| `timeout` | number | No | 30000 | Request timeout (ms) |
| `headers` | object | No | {} | Custom HTTP headers |
| `enabled` | boolean | No | true | Enable/disable proxy |
| `operations` | array | No | ["run", "validate", "parse"] | Operations to proxy |

## Environment Variables

Headers support environment variable expansion:

```json
{
  "proxy": {
    "headers": {
      "Authorization": "Bearer ${TSPEC_PROXY_TOKEN}",
      "X-Team-ID": "${TEAM_ID}"
    }
  }
}
```

## Verify Configuration

Check if proxy is reachable:

```bash
curl http://localhost:8080/health
```

Expected response:
```json
{"status":"ok","version":"1.0.0"}
```
