---
name: tspec-list
description: List supported protocols and TSpec configuration. Use for discovering available protocols, checking capabilities, and understanding what TSpec supports. Shows HTTP, gRPC, and other protocol availability. Keywords: list protocols, tspec capabilities, supported protocols, tspec features, available protocols
---

# TSpec List

## Overview

List supported protocols and TSpec configuration information. This skill displays what protocols are available (HTTP, gRPC, etc.), their status, and basic capability information. Use it to discover what TSpec supports and verify installation.

## MCP Tool Integration

### Tool Name: `tspec_list`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `output` | `string` | No | Output format: `json` or `text` (default: `text`) |

### Example MCP Call

```json
{
  "output": "text"
}
```

### Return Format

Returns protocol list with:
- Protocol names
- Support status
- Basic capability information

## CLI Command Reference

### Usage

```bash
tspec list [options]
```

### Options

| Option | Description |
|--------|-------------|
| `-o, --output <format>` | Output format: `json`, `text` (default: `text`) |

### CLI Examples

```bash
# List supported protocols
tspec list

# JSON output
tspec list --output json
```

## Common Use Cases

### Check Available Protocols

```bash
tspec list
```

Example output:
```
Supported Protocols:

  http    Supported    HTTP/HTTPS REST API testing
  grpc    Supported    gRPC service testing

Reserved (Future):
  graphql    Not yet supported
  websocket  Not yet supported
```

### Verify TSpec Installation

```bash
tspec list
```

If this works, TSpec is properly installed.

### Get Protocol Info in JSON

```bash
tspec list --output json
```

Example output:
```json
{
  "protocols": [
    {
      "name": "http",
      "status": "supported",
      "description": "HTTP/HTTPS REST API testing"
    },
    {
      "name": "grpc",
      "status": "supported",
      "description": "gRPC service testing"
    }
  ],
  "reserved": ["graphql", "websocket"]
}
```

## MCP Tool Examples

### Text Output

```json
{
  "output": "text"
}
```

### JSON Output

```json
{
  "output": "json"
}
```

## Exit Codes

| Code | Description |
|------|-------------|
| `0` | Success |
| `2` | Error |

## Related Skills

- [tspec-run](../tspec-run/SKILL.md) - Execute tests using listed protocols
- [tspec-validate](../tspec-validate/SKILL.md) - Validate test files
- [tspec-parse](../tspec-parse/SKILL.md) - Parse test files
