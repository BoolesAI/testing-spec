# TSpec Plugin Development Guide

This guide provides comprehensive instructions for developing custom TSpec plugins. Plugins extend TSpec's testing capabilities by adding support for new protocols, execution environments, or custom validation logic.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Plugin Interface](#plugin-interface)
- [Implementing a Plugin](#implementing-a-plugin)
- [Test Runner Implementation](#test-runner-implementation)
- [Schema Definition](#schema-definition)
- [Configuration and Options](#configuration-and-options)
- [Testing Your Plugin](#testing-your-plugin)
- [Publishing](#publishing)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

TSpec plugins are npm packages that implement the `TSpecPlugin` interface. Each plugin can:

- Support one or more protocols (e.g., `http`, `grpc`, `websocket`)
- Provide custom test runners for protocol execution
- Define JSON schemas for validation
- Include optional health checks and request validation

### Plugin Lifecycle

```
Installation → Discovery → Loading → Initialization → Registration → Execution → Disposal
```

1. **Installation**: Plugin npm package installed to `~/.tspec/plugins/` or project
2. **Discovery**: Found via `tspec.config.json` or naming convention
3. **Loading**: Module imported via ESM dynamic import
4. **Initialization**: `initialize(context)` called if defined
5. **Registration**: Protocols and schemas registered with plugin manager
6. **Execution**: `createRunner()` called for test execution
7. **Disposal**: `dispose()` called on unregistration

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- TypeScript (recommended)

### Project Setup

```bash
# Create plugin directory
mkdir tspec-protocol-myprotocol
cd tspec-protocol-myprotocol

# Initialize package
npm init -y

# Install dependencies
npm install --save-peer @boolesai/tspec
npm install --save-dev typescript vite @types/node
```

### Package Configuration

Update `package.json`:

```json
{
  "name": "@tspec/myprotocol",
  "version": "1.0.0",
  "description": "My custom protocol plugin for TSpec",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "keywords": ["tspec", "tspec-plugin", "myprotocol"],
  "tspec": {
    "plugin": true
  },
  "peerDependencies": {
    "@boolesai/tspec": "^1.2.0"
  },
  "devDependencies": {
    "@boolesai/tspec": "^1.2.0",
    "typescript": "^5.0.0",
    "vite": "^7.0.0"
  },
  "scripts": {
    "build": "vite build",
    "dev": "vite build --watch",
    "types": "tsc --emitDeclarationOnly"
  }
}
```

### TypeScript Configuration

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "declarationDir": "./dist",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

### Vite Configuration

Create `vite.config.js`:

```javascript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'index.js'
    },
    rollupOptions: {
      external: ['@boolesai/tspec', '@boolesai/tspec/plugin']
    },
    outDir: 'dist',
    sourcemap: true
  }
});
```

## Plugin Interface

### TSpecPlugin

The main interface your plugin must implement:

```typescript
interface TSpecPlugin {
  // Required: Plugin metadata
  readonly metadata: PluginMetadata;
  
  // Required: Protocol schemas
  readonly schemas: ProtocolSchema[];
  
  // Required: Create test runner for protocol
  createRunner(protocol: string, options: RunnerOptions): TestRunner;
  
  // Optional: Initialize plugin with context
  initialize?(context: PluginContext): Promise<void> | void;
  
  // Optional: Validate protocol-specific request
  validateRequest?(protocol: string, request: unknown): PluginValidationResult;
  
  // Optional: Health check
  healthCheck?(): Promise<PluginHealthStatus>;
  
  // Optional: Cleanup resources
  dispose?(): Promise<void> | void;
}
```

### PluginMetadata

```typescript
interface PluginMetadata {
  name: string;              // Unique plugin identifier
  version: string;           // Semver version string
  description?: string;      // Human-readable description
  protocols: string[];       // Array of protocol names this plugin handles
  compatibility?: string;    // TSpec core version range (e.g., ">=1.2.0")
  author?: string;           // Plugin author
  homepage?: string;         // Repository or documentation URL
  tags?: string[];          // Keywords for categorization
}
```

### PluginContext

Provided to your plugin during initialization:

```typescript
interface PluginContext {
  coreVersion: string;                    // TSpec core version
  config?: Record<string, unknown>;       // Plugin options from tspec.config.json
  logger?: PluginLogger;                  // Logger instance
}

interface PluginLogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}
```

## Implementing a Plugin

### Basic Plugin Structure

Create `src/index.ts`:

```typescript
import type { 
  TSpecPlugin, 
  PluginContext, 
  PluginValidationResult,
  RunnerOptions
} from '@boolesai/tspec/plugin';
import { MyProtocolRunner } from './runner.js';
import { myProtocolSchema } from './schema.js';
import type { MyProtocolOptions } from './types.js';

export const VERSION = '1.0.0';

export function createPlugin(context: PluginContext): TSpecPlugin {
  // Extract plugin-specific options from config
  const options = (context.config as MyProtocolOptions) || {};
  
  return {
    metadata: {
      name: 'myprotocol',
      version: VERSION,
      description: 'My custom protocol support for TSpec',
      protocols: ['myprotocol'],
      compatibility: '>=1.2.0',
      author: 'Your Name',
      homepage: 'https://github.com/yourname/tspec-protocol-myprotocol',
      tags: ['custom', 'myprotocol']
    },
    
    schemas: [myProtocolSchema],
    
    createRunner(protocol: string, runnerOptions: RunnerOptions) {
      // Merge plugin config with per-run options
      const mergedOptions = { ...options, ...runnerOptions };
      return new MyProtocolRunner(mergedOptions);
    },
    
    validateRequest(protocol: string, request: unknown): PluginValidationResult {
      const errors: string[] = [];
      
      if (!request || typeof request !== 'object') {
        errors.push('Request must be an object');
        return { valid: false, errors };
      }
      
      // Add your validation logic here
      const req = request as Record<string, unknown>;
      if (!req.endpoint) {
        errors.push('myprotocol.endpoint is required');
      }
      
      return {
        valid: errors.length === 0,
        errors
      };
    },
    
    async healthCheck() {
      // Verify dependencies are available
      try {
        // Check your protocol dependencies
        return {
          healthy: true,
          message: 'MyProtocol plugin is ready'
        };
      } catch (error) {
        return {
          healthy: false,
          message: `Dependency check failed: ${(error as Error).message}`
        };
      }
    },
    
    async initialize(context: PluginContext) {
      // Optional: Setup resources, connections, etc.
      context.logger?.info('MyProtocol plugin initialized');
    },
    
    async dispose() {
      // Optional: Cleanup resources, close connections, etc.
    }
  };
}

// Default export is required for plugin loading
export default createPlugin;
```

## Test Runner Implementation

### TestRunner Interface

```typescript
interface TestRunner {
  execute(testCase: TestCase): Promise<Response>;
}

interface TestCase {
  protocol: string | null;
  request: unknown;
  // Other test case fields...
}

interface Response {
  protocol: string;
  statusCode?: number;
  headers?: Record<string, string>;
  body?: unknown;
  duration?: number;
  error?: string;
  // Protocol-specific fields...
}
```

### Example Runner Implementation

Create `src/runner.ts`:

```typescript
import type { MyProtocolRequest, MyProtocolOptions, MyProtocolResponse } from './types.js';

interface TestCase {
  protocol: string | null;
  request: unknown;
}

interface TestRunner {
  execute(testCase: TestCase): Promise<MyProtocolResponse>;
}

export class MyProtocolRunner implements TestRunner {
  private options: MyProtocolOptions;

  constructor(options: MyProtocolOptions = {}) {
    this.options = {
      timeout: 30000,
      retries: 0,
      ...options
    };
  }

  async execute(testCase: TestCase): Promise<MyProtocolResponse> {
    // Validate protocol
    if (testCase.protocol !== 'myprotocol') {
      throw new Error(`MyProtocolRunner only supports myprotocol, got: ${testCase.protocol}`);
    }

    const request = testCase.request as MyProtocolRequest;
    if (!request) {
      throw new Error('No request defined in test case');
    }

    const startTime = Date.now();
    
    try {
      // Execute your protocol logic here
      const result = await this.executeRequest(request);
      const duration = Date.now() - startTime;
      
      return {
        protocol: 'myprotocol',
        success: true,
        duration,
        ...result
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        protocol: 'myprotocol',
        success: false,
        duration,
        error: (error as Error).message
      };
    }
  }

  private async executeRequest(request: MyProtocolRequest): Promise<Partial<MyProtocolResponse>> {
    // Implement your protocol-specific execution logic
    // This could be HTTP calls, WebSocket messages, gRPC calls, etc.
    
    return {
      statusCode: 200,
      body: { message: 'Success' }
    };
  }
}
```

## Schema Definition

### ProtocolSchema Interface

```typescript
interface ProtocolSchema {
  protocol: string;
  requestSchema: Record<string, unknown>;  // JSON Schema
  optionsSchema?: Record<string, unknown>; // JSON Schema for options
  examples?: Array<{
    description: string;
    request: Record<string, unknown>;
  }>;
}
```

### Example Schema Definition

Create `src/schema.ts`:

```typescript
import type { ProtocolSchema } from '@boolesai/tspec/plugin';

export const myProtocolSchema: ProtocolSchema = {
  protocol: 'myprotocol',
  
  requestSchema: {
    type: 'object',
    properties: {
      endpoint: {
        type: 'string',
        description: 'Target endpoint URL'
      },
      method: {
        type: 'string',
        enum: ['SEND', 'REQUEST', 'SUBSCRIBE'],
        description: 'Protocol method'
      },
      payload: {
        type: 'object',
        description: 'Request payload'
      },
      headers: {
        type: 'object',
        additionalProperties: { type: 'string' },
        description: 'Custom headers'
      },
      timeout: {
        type: 'number',
        description: 'Request timeout in milliseconds'
      }
    },
    required: ['endpoint', 'method'],
    additionalProperties: false
  },
  
  optionsSchema: {
    type: 'object',
    properties: {
      timeout: {
        type: 'number',
        default: 30000
      },
      retries: {
        type: 'number',
        default: 0
      }
    }
  },
  
  examples: [
    {
      description: 'Basic request',
      request: {
        endpoint: 'myprotocol://localhost:8080/service',
        method: 'SEND',
        payload: {
          message: 'Hello'
        }
      }
    }
  ]
};
```

## Configuration and Options

### Plugin Options in tspec.config.json

Users configure your plugin via `tspec.config.json`:

```json
{
  "plugins": ["@tspec/myprotocol"],
  "pluginOptions": {
    "@tspec/myprotocol": {
      "timeout": 60000,
      "retries": 3,
      "customOption": "value"
    }
  }
}
```

### Accessing Options

Options are passed via `PluginContext.config`:

```typescript
export function createPlugin(context: PluginContext): TSpecPlugin {
  const options = context.config as MyProtocolOptions || {};
  
  // Use default values
  const timeout = options.timeout ?? 30000;
  const retries = options.retries ?? 0;
  
  // ...
}
```

### Type Definitions

Create `src/types.ts`:

```typescript
export interface MyProtocolOptions {
  timeout?: number;
  retries?: number;
  customOption?: string;
}

export interface MyProtocolRequest {
  endpoint: string;
  method: 'SEND' | 'REQUEST' | 'SUBSCRIBE';
  payload?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface MyProtocolResponse {
  protocol: string;
  success: boolean;
  statusCode?: number;
  body?: unknown;
  duration?: number;
  error?: string;
}
```

## Testing Your Plugin

### Local Development

1. Build your plugin:
```bash
npm run build
```

2. Link for local testing:
```bash
npm link
```

3. In a test project, use the plugin:
```json
{
  "plugins": ["./path/to/tspec-protocol-myprotocol"]
}
```

Or link it:
```bash
npm link @tspec/myprotocol
```

### Unit Tests

Create tests for your runner and validation logic:

```typescript
// test/runner.test.ts
import { describe, it, expect } from 'vitest';
import { MyProtocolRunner } from '../src/runner.js';

describe('MyProtocolRunner', () => {
  it('should execute a basic request', async () => {
    const runner = new MyProtocolRunner({ timeout: 5000 });
    
    const result = await runner.execute({
      protocol: 'myprotocol',
      request: {
        endpoint: 'myprotocol://localhost/test',
        method: 'SEND',
        payload: { test: true }
      }
    });
    
    expect(result.protocol).toBe('myprotocol');
    expect(result.success).toBe(true);
  });
  
  it('should handle errors gracefully', async () => {
    const runner = new MyProtocolRunner();
    
    const result = await runner.execute({
      protocol: 'myprotocol',
      request: {
        endpoint: 'invalid://endpoint',
        method: 'SEND'
      }
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

### Integration Tests

Test with actual TSpec:

```bash
# Create a test case file
cat > test.myprotocol.tcase << EOF
version: "1.0"
description: "Test my protocol"

myprotocol:
  endpoint: "myprotocol://localhost:8080/test"
  method: "SEND"
  payload:
    message: "Hello"

assertions:
  - type: "json_path"
    expression: "$.success"
    operator: "equals"
    expected: true
EOF

# Run the test
tspec run test.myprotocol.tcase
```

## Publishing

### Prepare for Publication

1. Ensure all tests pass
2. Update version in `package.json`
3. Build the distribution:
```bash
npm run build
npm run types
```

4. Test the package locally:
```bash
npm pack
# Install in another project to verify
```

### Publish to npm

```bash
# Login to npm
npm login

# Publish (public by default for scoped packages)
npm publish --access public
```

### Naming Conventions

- Official plugins: `@tspec/<protocol-name>`
- Third-party plugins: `tspec-protocol-<name>` or `@yourscope/tspec-<name>`

## Best Practices

### Error Handling

- Always return structured responses, even on errors
- Include meaningful error messages
- Use timeouts to prevent hanging
- Catch and handle all exceptions

```typescript
async execute(testCase: TestCase): Promise<Response> {
  try {
    return await this.executeWithTimeout(testCase);
  } catch (error) {
    return {
      protocol: this.protocol,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    };
  }
}
```

### Logging

Use the provided logger for debugging:

```typescript
initialize(context: PluginContext) {
  context.logger?.debug('Initializing with options:', this.options);
  context.logger?.info('Plugin ready');
}
```

### Resource Management

Clean up resources properly:

```typescript
async dispose() {
  // Close connections
  await this.client?.close();
  
  // Clear caches
  this.cache.clear();
  
  // Cancel pending operations
  this.pendingRequests.forEach(r => r.cancel());
}
```

### Validation

Validate requests before execution:

```typescript
validateRequest(protocol: string, request: unknown): PluginValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Required field validation
  if (!request?.endpoint) {
    errors.push('endpoint is required');
  }
  
  // Type validation
  if (typeof request?.timeout !== 'undefined' && typeof request.timeout !== 'number') {
    errors.push('timeout must be a number');
  }
  
  // Deprecation warnings
  if (request?.legacyOption) {
    warnings.push('legacyOption is deprecated, use newOption instead');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}
```

## Troubleshooting

### Plugin Not Loading

- Verify `package.json` has `"tspec": { "plugin": true }`
- Check the default export is a function returning `TSpecPlugin`
- Ensure ESM module format (`"type": "module"`)
- Verify plugin is listed in `tspec.config.json`

### Import Errors

- Use `.js` extensions in imports (TypeScript ESM requirement)
- Ensure peer dependency `@boolesai/tspec` is installed
- Check module resolution settings in `tsconfig.json`

### Runtime Errors

- Enable debug logging: `DEBUG=true tspec run ...`
- Check `healthCheck()` output: `tspec plugin:list --health`
- Verify protocol name matches between schema and test case

### Build Issues

- Run `npm run types` to check TypeScript errors
- Verify vite externals include all peer dependencies
- Check for circular dependencies

## Examples

See these official plugins for reference implementations:

- [HTTP Plugin](./tspec-protocol-http/src/index.ts) - REST API testing
- [Web Plugin](./tspec-protocol-web/src/index.ts) - Browser UI testing

## Support

- [GitHub Issues](https://github.com/boolesai/testing-spec/issues)
- [Plugin API Reference](./README.md#plugin-api-reference)
- [TSpec Documentation](../docs/)
