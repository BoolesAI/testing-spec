# tspec plugin:list

List all installed TSpec plugins and their status. Plugins extend TSpec with custom protocols, assertions, and lifecycle actions.

## CLI Command

### Usage

```bash
tspec plugin:list [options]
tspec plugins [options]    # alias
```

### Options

| Option | Description |
|--------|-------------|
| `-o, --output <format>` | Output format: `json`, `text` (default: `text`) |
| `-v, --verbose` | Show detailed plugin information (author, homepage) |
| `--health` | Run health checks on all plugins |
| `-c, --config <path>` | Path to tspec.config.json |

### CLI Examples

```bash
# List all installed plugins
tspec plugin:list

# Use the alias
tspec plugins

# Show detailed information
tspec plugin:list -v

# Run health checks
tspec plugin:list --health

# JSON output
tspec plugin:list --output json
```

## Output Format

### Text Output

```
TSpec Plugins

Config:
  Local:  ./tspec.config.json
  Global: ~/.tspec/tspec.config.json
  Plugins dir: ~/.tspec/plugins

@tspec/http v1.0.0
  Protocols: http, https

@tspec/web v1.0.0
  Protocols: web, browser

Supported Protocols: http, https, web, browser
```

### JSON Output

```json
{
  "plugins": [
    {
      "name": "@tspec/http",
      "version": "1.0.0",
      "description": "HTTP protocol support for TSpec",
      "protocols": ["http", "https"],
      "author": "BoolesAI",
      "homepage": "https://github.com/boolesai/tspec"
    }
  ],
  "protocols": ["http", "https", "grpc", "websocket"],
  "configPath": "./tspec.config.json",
  "configSources": {
    "local": "./tspec.config.json",
    "global": "~/.tspec/tspec.config.json"
  },
  "pluginsDir": "~/.tspec/plugins"
}
```

## Health Checks

Use `--health` to verify that all plugins are functioning correctly:

```bash
tspec plugin:list --health
```

Output includes health status for each plugin:

```
Health Check

@tspec/http: ✓ Healthy
@tspec/web: ✗ Unhealthy
  Connection timeout
```

## Exit Codes

| Code | Description |
|------|-------------|
| `0` | Success |
| `2` | Error (invalid config, etc.) |

## Related Commands

- [tspec plugin:install](./tspec-plugin-install.md) - Install a plugin
- [tspec list](./tspec-list.md) - List supported protocols