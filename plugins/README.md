# TSpec Plugins

This directory contains official protocol plugins for TSpec. Plugins extend TSpec's testing capabilities by adding support for different protocols and execution environments.

## Overview

TSpec uses a plugin architecture that allows protocol handlers to be implemented as separate npm packages. Each plugin provides:

- **Protocol support**: HTTP/HTTPS, Web UI, gRPC, GraphQL, etc.
- **Request execution**: Protocol-specific test execution logic
- **Schema validation**: JSON Schema for protocol-specific blocks
- **Runner implementation**: Custom test runners for each protocol

## Available Plugins

### [`tspec-protocol-http`](./tspec-protocol-http)

HTTP/HTTPS protocol support for API testing.

- **Protocols**: `http`, `https`
- **Use cases**: REST API testing, HTTP endpoint validation
- **File extension**: `.http.tcase`
- **Dependencies**: axios
- **Package name**: `@tspec/http`

**Example**:
```yaml
version: "1.0"
description: "Test user login API"

http:
  method: "POST"
  path: "/api/v1/auth/login"
  headers:
    Content-Type: "application/json"
  body:
    json:
      username: "test_user"
      password: "password123"

assertions:
  - type: "json_path"
    expression: "$.status"
    operator: "equals"
    expected: 200
```

### [`tspec-protocol-web`](./tspec-protocol-web)

Web browser UI testing using Puppeteer.

- **Protocols**: `web`
- **Use cases**: E2E testing, UI automation, browser interaction
- **File extension**: `.web.tcase`
- **Dependencies**: puppeteer
- **Package name**: `@tspec/web`

**Example**:
```yaml
version: "1.0"
description: "Test login form"

web:
  actions:
    - action: "navigate"
      url: "https://example.com/login"
    - action: "fill"
      selector: "#username"
      value: "test_user"
    - action: "fill"
      selector: "#password"
      value: "password123"
    - action: "click"
      selector: "#login-button"
    - action: "wait"
      selector: ".dashboard"

assertions:
  - type: "json_path"
    expression: "$.url"
    operator: "contains"
    expected: "/dashboard"
```

## Usage

### 1. Installation

The easiest way to install plugins is using the CLI:

```bash
# Install plugins via CLI (auto-adds to config)
tspec plugin:install @tspec/http
tspec plugin:install @tspec/web
```

Or install manually via npm:

```bash
# Install TSpec core
npm install -D @boolesai/tspec

# Install plugins
npm install -D @tspec/http
npm install -D @tspec/web
```

### 2. Configuration

TSpec uses JSON configuration files (`tspec.config.json`).

**Configuration Locations:**

| Location | Path | Priority |
|----------|------|----------|
| Local | `./tspec.config.json` (searched upward) | Higher |
| Global | `~/.tspec/tspec.config.json` | Lower |

**Example `tspec.config.json`:**

```json
{
  "plugins": [
    "@tspec/http",
    "@tspec/web"
  ],
  "pluginOptions": {
    "@tspec/http": {
      "timeout": 30000,
      "followRedirects": true,
      "maxRedirects": 5
    },
    "@tspec/web": {
      "headless": true,
      "timeout": 30000
    }
  }
}
```

**Auto-Installation:** When running `tspec run`, missing plugins are automatically installed to `~/.tspec/plugins/`. Use `--no-auto-install` to disable.

### 3. Running Tests

```bash
# Run tests with plugins auto-loaded
npx tspec run tests/**/*.tcase

# List loaded plugins
npx tspec plugin:list

# Validate test cases
npx tspec validate tests/**/*.tcase
```

## Plugin Architecture

### Plugin Structure

Each plugin must implement the `TSpecPlugin` interface:

```typescript
import type { TSpecPlugin, PluginContext } from '@boolesai/tspec/plugin';

export function createPlugin(context: PluginContext): TSpecPlugin {
  return {
    metadata: {
      name: 'my-protocol',
      version: '1.0.0',
      protocols: ['my-protocol']
    },
    schemas: [{ protocol: 'my-protocol', requestSchema: { /* JSON Schema */ } }],
    createRunner(protocol, options) {
      return new MyProtocolRunner(options);
    }
  };
}

export default createPlugin;
```

### Plugin Discovery

Plugins are discovered through:

1. **Configuration file**: `tspec.config.json` plugins array
2. **Package.json marker**: `"tspec": { "plugin": true }`
3. **Naming convention**: Packages starting with `@tspec/` or `tspec-`

### Plugin Loading

The plugin manager automatically:

1. Resolves plugin package names or paths
2. Loads plugin modules (ESM default export)
3. Initializes plugins with context
4. Registers protocols and schemas
5. Makes runners available to test executor

## Creating Custom Plugins

For detailed guidance on developing custom plugins, see the **[Plugin Development Guide](./DEVELOPMENT.md)**.

Quick start:

```bash
# Create plugin directory
mkdir my-tspec-plugin && cd my-tspec-plugin
npm init -y

# Install peer dependency
npm install --save-peer @boolesai/tspec
```

## Plugin API Reference

### PluginMetadata

```typescript
interface PluginMetadata {
  name: string;              // Plugin name
  version: string;           // Plugin version (semver)
  description?: string;      // Human-readable description
  protocols: string[];       // Supported protocols
  compatibility?: string;    // TSpec core version range
  author?: string;           // Plugin author
  homepage?: string;         // Repository or docs URL
  tags?: string[];          // Categorization tags
}
```

### ProtocolSchema

```typescript
interface ProtocolSchema {
  protocol: string;                    // Protocol name
  requestSchema: Record<string, unknown>;  // JSON Schema for request
  optionsSchema?: Record<string, unknown>; // JSON Schema for options
  examples?: Array<{
    description: string;
    request: Record<string, unknown>;
  }>;
}
```

### PluginContext

```typescript
interface PluginContext {
  coreVersion: string;       // TSpec core version
  logger: PluginLogger;      // Logger instance
  config?: unknown;          // Plugin-specific config from tspec.config.json
}
```

### TestRunner

```typescript
interface TestRunner {
  execute(testCase: TestCase): Promise<Response>;
}
```

## Resources

- [Plugin Development Guide](./DEVELOPMENT.md)
- [Protocol Reference](../docs/10-protocol-reference.md)
- [Core API Documentation](../core/README.md)
- [Example: HTTP Plugin](./tspec-protocol-http/src/index.ts)
- [Example: Web Plugin](./tspec-protocol-web/src/index.ts)

## Contributing

We welcome plugin contributions! To contribute:

1. Follow the plugin architecture guidelines
2. Include comprehensive tests
3. Document protocol-specific features
4. Submit a pull request with examples

## License

All official plugins are licensed under MIT License. See individual plugin directories for details.
