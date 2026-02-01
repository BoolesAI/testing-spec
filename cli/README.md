# @boolesai/tspec-cli

Command-line interface for TSpec - a multi-protocol testing DSL designed for Developer + AI collaboration.

[![npm version](https://img.shields.io/npm/v/@boolesai/tspec-cli.svg)](https://www.npmjs.com/package/@boolesai/tspec-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
npm install -g @boolesai/tspec-cli
```

Or run directly with npx:

```bash
npx @boolesai/tspec-cli <command>
```

## Commands

### `tspec validate`

Validate `.tcase` files for schema correctness.

```bash
tspec validate <files...> [options]
```

**Options:**
- `-o, --output <format>` - Output format: `json`, `text` (default: `text`)
- `-q, --quiet` - Only output errors

**Examples:**
```bash
# Validate a single file
tspec validate tests/login.http.tcase

# Validate multiple files with glob pattern
tspec validate "tests/**/*.tcase"

# JSON output for CI/CD
tspec validate tests/*.tcase --output json
```

### `tspec run`

Execute test cases and report results.

```bash
tspec run <files...> [options]
```

**Options:**
- `-o, --output <format>` - Output format: `json`, `text` (default: `text`)
- `-c, --concurrency <n>` - Max concurrent tests (default: `5`)
- `-e, --env <key=value>` - Environment variables (repeatable)
- `-p, --params <key=value>` - Parameters (repeatable)
- `-v, --verbose` - Verbose output
- `-q, --quiet` - Only output summary
- `--fail-fast` - Stop on first failure

**Examples:**
```bash
# Run tests with default settings
tspec run tests/*.http.tcase

# Run with environment variables
tspec run tests/*.tcase -e API_HOST=api.example.com -e API_KEY=secret

# Run with parameters
tspec run tests/*.tcase -p username=testuser -p timeout=5000

# Run with higher concurrency
tspec run tests/*.tcase -c 10

# Verbose output for debugging
tspec run tests/*.tcase -v

# JSON output for CI/CD
tspec run tests/*.tcase --output json

# Stop on first failure
tspec run tests/*.tcase --fail-fast
```

### `tspec parse`

Parse and display test case information without execution.

```bash
tspec parse <files...> [options]
```

**Options:**
- `-o, --output <format>` - Output format: `json`, `text` (default: `text`)
- `-v, --verbose` - Show detailed information
- `-q, --quiet` - Minimal output
- `-e, --env <key=value>` - Environment variables
- `-p, --params <key=value>` - Parameters

**Examples:**
```bash
# Parse and display test cases
tspec parse tests/login.http.tcase

# JSON output for inspection
tspec parse tests/*.tcase --output json

# With variable substitution
tspec parse tests/*.tcase -e API_HOST=localhost
```

### `tspec list`

List supported protocols and configuration.

```bash
tspec list [options]
```

**Options:**
- `-o, --output <format>` - Output format: `json`, `text` (default: `text`)

**Examples:**
```bash
# List supported protocols
tspec list

# JSON output
tspec list --output json
```

### `tspec mcp`

Start MCP (Model Context Protocol) server for AI tool integration.

```bash
tspec mcp
```

This starts an MCP server over stdio that exposes TSpec commands as tools for AI assistants like Claude.

## MCP Integration

TSpec CLI can run as an MCP (Model Context Protocol) server, exposing all commands as tools for AI assistants. This enables AI assistants like Claude to execute TSpec commands directly through the MCP protocol.

### Overview

The MCP server runs over stdio, providing a standardized interface for AI tools to:
- Execute test cases with customizable parameters
- Validate test case files for schema correctness
- Parse test specifications without execution
- Query supported protocols and configurations

### Available Tools

| Tool | Description |
|------|-------------|
| `tspec_run` | Execute test cases and report results |
| `tspec_validate` | Validate .tcase files for schema correctness |
| `tspec_parse` | Parse and display test case information |
| `tspec_list` | List supported protocols |

### Configuration

#### Claude Desktop

Add the following to your Claude Desktop configuration file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
**Linux:** `~/.config/Claude/claude_desktop_config.json`

**Option 1: Using npx (recommended for always getting the latest version):**

```json
{
  "mcpServers": {
    "tspec": {
      "command": "npx",
      "args": ["-y", "@boolesai/tspec-cli", "mcp"]
    }
  }
}
```

**Option 2: Using global installation:**

```json
{
  "mcpServers": {
    "tspec": {
      "command": "tspec",
      "args": ["mcp"]
    }
  }
}
```

**Option 3: Using absolute path (for development or specific versions):**

```json
{
  "mcpServers": {
    "tspec": {
      "command": "/path/to/tspec/cli/bin/tspec.js",
      "args": ["mcp"]
    }
  }
}
```

#### Other MCP Clients

For other MCP-compatible clients, start the server with:

```bash
tspec mcp
```

The server will communicate via stdio, waiting for JSON-RPC 2.0 formatted requests.

### Server Behavior

- **Transport:** stdio (reads from stdin, writes to stdout)
- **Protocol:** JSON-RPC 2.0 over MCP
- **Lifecycle:** Runs indefinitely until explicitly terminated (Ctrl+C or SIGTERM)
- **Logging:** Error logs are written to stderr to avoid polluting stdio transport

### Tool Parameters

#### tspec_run

Execute test cases with optional configuration.

**Parameters:**
- `files` (required): Array of file paths or glob patterns
- `concurrency` (optional): Maximum concurrent test execution (default: 5)
- `env` (optional): Environment variables as key-value object
- `params` (optional): Test parameters as key-value object
- `failFast` (optional): Stop on first failure (default: false)
- `output` (optional): Output format - "json" or "text" (default: "text")

**Example:**
```json
{
  "files": ["tests/*.tcase"],
  "concurrency": 5,
  "env": { "API_HOST": "localhost", "API_PORT": "8080" },
  "params": { "timeout": "5000" },
  "failFast": false,
  "output": "text"
}
```

#### tspec_validate

Validate test case files for schema correctness.

**Parameters:**
- `files` (required): Array of file paths or glob patterns
- `output` (optional): Output format - "json" or "text" (default: "text")

**Example:**
```json
{
  "files": ["tests/*.tcase"],
  "output": "text"
}
```

#### tspec_parse

Parse test case files without execution.

**Parameters:**
- `files` (required): Array of file paths or glob patterns
- `env` (optional): Environment variables for variable substitution
- `params` (optional): Parameters for variable substitution
- `verbose` (optional): Show detailed information (default: false)
- `output` (optional): Output format - "json" or "text" (default: "text")

**Example:**
```json
{
  "files": ["tests/*.tcase"],
  "env": { "API_HOST": "localhost" },
  "params": { "timeout": "5000" },
  "verbose": true,
  "output": "text"
}
```

#### tspec_list

List supported protocols and configuration.

**Parameters:**
- `output` (optional): Output format - "json" or "text" (default: "text")

**Example:**
```json
{
  "output": "text"
}
```

### Troubleshooting

**Server doesn't appear in Claude Desktop:**
- Verify the configuration file path is correct for your OS
- Check JSON syntax is valid (use a JSON validator)
- Restart Claude Desktop after configuration changes
- Check Claude Desktop logs for connection errors

**Server hangs or doesn't respond:**
- Ensure Node.js >= 18.0.0 is installed
- Verify `@boolesai/tspec-cli` is accessible (try running `tspec --version`)
- Check stderr output for error messages

**Permission errors:**
- Ensure the tspec executable has proper permissions
- For global installation, verify npm global bin directory is in PATH

## Exit Codes

| Code | Description |
|------|-------------|
| `0` | Success (all tests passed / validation passed) |
| `1` | Failure (tests failed / validation errors) |
| `2` | Error (invalid input / configuration error) |

## CI/CD Integration

### GitHub Actions

```yaml
- name: Run TSpec tests
  run: |
    npx @boolesai/tspec-cli run tests/*.tcase --output json > results.json
    
- name: Validate TSpec files
  run: npx @boolesai/tspec-cli validate tests/*.tcase
```

### GitLab CI

```yaml
test:
  script:
    - npx @boolesai/tspec-cli run tests/*.tcase --output json
  artifacts:
    reports:
      junit: results.json
```

## Build from Source

Prerequisites:
- Node.js >= 18.0.0
- npm >= 9.0.0

```bash
# Clone the repository
git clone https://github.com/boolesai/testing-spec.git
cd testing-spec

# Build core package first (required dependency)
cd core
npm install
npm run package
npm link

# Build CLI package
cd ../cli
npm install
npm link @boolesai/tspec
npm run build
```

### Build Output

- `dist/` - Compiled JavaScript
- `types/` - TypeScript type definitions
- `bin/` - Executable entry point

### Install Built CLI Globally

```bash
# From the cli directory
npm install -g .

# Or link for development
npm link
```

### Create Distribution Package

```bash
# Create a tarball for distribution
npm run package

# This generates @boolesai-tspec-cli-0.0.1.tgz
# Install from tarball:
npm install -g ./boolesai-tspec-cli-0.0.1.tgz
```

### Development Mode

```bash
# Watch mode for development
npm run dev
```

## Documentation

For complete TSpec DSL documentation, see the [docs](../doc) directory.

## Related

- [@boolesai/tspec](https://www.npmjs.com/package/@boolesai/tspec) - Core library for TSpec

## License

MIT
