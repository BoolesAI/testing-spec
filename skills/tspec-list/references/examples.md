# TSpec List Examples

## Basic Usage

### List All Protocols

```bash
tspec list
```

Example output:
```
TSpec Protocol Support
======================

Supported Protocols:
  - http:    HTTP/HTTPS REST API testing
  - grpc:    gRPC service testing with protobuf

Reserved for Future:
  - graphql: GraphQL API testing (not yet implemented)
  - websocket: WebSocket testing (not yet implemented)

Version: 1.0
```

## Output Formats

### Text Output (Default)

```bash
tspec list
```

Human-readable format for terminal display.

### JSON Output

```bash
tspec list --output json
```

Example output:
```json
{
  "version": "1.0",
  "protocols": {
    "supported": [
      {
        "name": "http",
        "description": "HTTP/HTTPS REST API testing",
        "features": ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]
      },
      {
        "name": "grpc",
        "description": "gRPC service testing with protobuf",
        "features": ["unary", "server-streaming", "client-streaming", "bidirectional"]
      }
    ],
    "reserved": ["graphql", "websocket"]
  }
}
```

## MCP Tool Examples

### Text Output

```json
{
  "output": "text"
}
```

### JSON Output for Programmatic Use

```json
{
  "output": "json"
}
```

## Use Cases

### Verify Installation

```bash
# Quick check that tspec is working
tspec list
```

### Check Protocol Support Before Writing Tests

```bash
# Confirm gRPC is supported before writing gRPC tests
tspec list | grep grpc
```

### Programmatic Protocol Discovery

```bash
# Get supported protocols as JSON for scripts
tspec list --output json | jq '.protocols.supported[].name'
```

Output:
```
"http"
"grpc"
```

### CI/CD Environment Verification

```yaml
# GitHub Actions example
- name: Verify TSpec installation
  run: npx @boolesai/tspec-cli list
```
