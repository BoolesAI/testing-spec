# tspec mcp

Start the Model Context Protocol (MCP) server for AI tool integration. This command exposes TSpec capabilities as tools that can be used by AI assistants like Claude Desktop.

## CLI Command

### Usage

```bash
tspec mcp
```

The MCP server runs as a long-running process that communicates via stdio. It is typically started automatically by MCP clients like Claude Desktop.

## Available MCP Tools

When the MCP server is running, the following tools are available:

| Tool | Description |
|------|-------------|
| `tspec_list` | List supported protocols and configuration |
| `tspec_validate` | Validate test file syntax |
| `tspec_parse` | Parse and inspect test files |
| `tspec_run` | Execute tests and return results |

## Claude Desktop Configuration

To use TSpec with Claude Desktop, add the following to your Claude Desktop configuration:

### macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

### Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "tspec": {
      "command": "npx",
      "args": ["-y", "@boolesai/tspec-cli", "mcp"],
      "env": {}
    }
  }
}
```

### With Local Installation

If TSpec is installed locally in your project:

```json
{
  "mcpServers": {
    "tspec": {
      "command": "node",
      "args": ["./node_modules/@boolesai/tspec-cli/dist/index.js", "mcp"],
      "cwd": "/path/to/your/project",
      "env": {}
    }
  }
}
```

## Using MCP Tools

Once configured, you can ask Claude to use TSpec tools:

**Example prompts for Claude:**

```
List the available TSpec protocols
```

```
Validate all test files in the tests/ directory
```

```
Run the API test suite and show me the results
```

```
Parse the login.http.tcase file and show me its structure
```

## Tool Parameters

### tspec_list

```json
{
  "output": "json"
}
```

### tspec_validate

```json
{
  "files": ["tests/*.http.tcase"],
  "output": "json"
}
```

### tspec_parse

```json
{
  "files": ["tests/login.http.tcase"],
  "env": { "API_HOST": "localhost" },
  "params": {},
  "verbose": false,
  "output": "json"
}
```

### tspec_run

```json
{
  "files": ["tests/*.http.tcase"],
  "concurrency": 5,
  "env": { "API_HOST": "localhost:3000" },
  "params": {},
  "failFast": false,
  "output": "json"
}
```

## Server Lifecycle

1. MCP client (Claude Desktop) starts the TSpec MCP server
2. Server registers tools with the client
3. Client can invoke tools as needed
4. Server processes requests and returns results
5. Server runs until the client terminates it

## Troubleshooting

### Server Not Starting

Check the Claude Desktop logs:
- macOS: `~/Library/Logs/Claude/`
- Windows: `%APPDATA%\Claude\Logs\`

### Tool Not Found

Ensure TSpec CLI is properly installed:

```bash
npx @boolesai/tspec-cli list
```

### Connection Errors

1. Verify the path to the TSpec CLI is correct
2. Check that Node.js is installed and accessible
3. Ensure environment variables are set correctly

## Related Documentation

- [tspec list](./tspec-list.md) - List protocols tool reference
- [tspec validate](./tspec-validate.md) - Validate tool reference
- [tspec parse](./tspec-parse.md) - Parse tool reference
- [tspec run](./tspec-run.md) - Run tool reference