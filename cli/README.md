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

Validate `.tspec` files for schema correctness.

```bash
tspec validate <files...> [options]
```

**Options:**
- `-o, --output <format>` - Output format: `json`, `text` (default: `text`)
- `-q, --quiet` - Only output errors

**Examples:**
```bash
# Validate a single file
tspec validate tests/login.http.tspec

# Validate multiple files with glob pattern
tspec validate "tests/**/*.tspec"

# JSON output for CI/CD
tspec validate tests/*.tspec --output json
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
tspec run tests/*.http.tspec

# Run with environment variables
tspec run tests/*.tspec -e API_HOST=api.example.com -e API_KEY=secret

# Run with parameters
tspec run tests/*.tspec -p username=testuser -p timeout=5000

# Run with higher concurrency
tspec run tests/*.tspec -c 10

# Verbose output for debugging
tspec run tests/*.tspec -v

# JSON output for CI/CD
tspec run tests/*.tspec --output json

# Stop on first failure
tspec run tests/*.tspec --fail-fast
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
tspec parse tests/login.http.tspec

# JSON output for inspection
tspec parse tests/*.tspec --output json

# With variable substitution
tspec parse tests/*.tspec -e API_HOST=localhost
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

TSpec CLI can run as an MCP server, exposing all commands as tools for AI assistants.

### Available Tools

| Tool | Description |
|------|-------------|
| `tspec_run` | Execute test cases and report results |
| `tspec_validate` | Validate .tspec files for schema correctness |
| `tspec_parse` | Parse and display test case information |
| `tspec_list` | List supported protocols |

### Claude Desktop Configuration

Add the following to your Claude Desktop configuration file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

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

Or if installed globally:

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

### Tool Parameters

#### tspec_run

```json
{
  "files": ["tests/*.tspec"],
  "concurrency": 5,
  "env": { "API_HOST": "localhost" },
  "params": { "timeout": "5000" },
  "failFast": false,
  "output": "text"
}
```

#### tspec_validate

```json
{
  "files": ["tests/*.tspec"],
  "output": "text"
}
```

#### tspec_parse

```json
{
  "files": ["tests/*.tspec"],
  "env": { "API_HOST": "localhost" },
  "params": { "timeout": "5000" },
  "verbose": true,
  "output": "text"
}
```

#### tspec_list

```json
{
  "output": "text"
}
```

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
    npx @boolesai/tspec-cli run tests/*.tspec --output json > results.json
    
- name: Validate TSpec files
  run: npx @boolesai/tspec-cli validate tests/*.tspec
```

### GitLab CI

```yaml
test:
  script:
    - npx @boolesai/tspec-cli run tests/*.tspec --output json
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
