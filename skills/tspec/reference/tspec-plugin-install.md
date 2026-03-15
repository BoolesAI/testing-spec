# tspec plugin:install

Install a TSpec plugin from npm or a local package and add it to your configuration.

## CLI Command

### Usage

```bash
tspec plugin:install <plugin> [options]
tspec install <plugin> [options]    # alias
```

### Arguments

| Argument | Description |
|----------|-------------|
| `<plugin>` | Plugin name (npm package name, e.g., `@tspec/http`) |

### Options

| Option | Description |
|--------|-------------|
| `-o, --output <format>` | Output format: `json`, `text` (default: `text`) |
| `-g, --global` | Add plugin to global config (`~/.tspec/tspec.config.json`) |
| `-c, --config <path>` | Path to specific config file to update |

### CLI Examples

```bash
# Install a plugin from npm
tspec plugin:install @tspec/http

# Use the alias
tspec install @tspec/http

# Install to global config
tspec plugin:install @tspec/http --global

# Install to specific config file
tspec plugin:install @tspec/http --config ./custom-config.json

# JSON output for scripting
tspec plugin:install @tspec/http --output json
```

## Installation Process

1. Downloads the plugin package from npm
2. Installs to the TSpec plugins directory (`~/.tspec/plugins/`)
3. Adds the plugin to your `tspec.config.json`

## Configuration Update

After installation, the plugin is added to your config:

```json
{
  "plugins": [
    "@tspec/http",
    "@tspec/web"
  ]
}
```

## Local vs Global Installation

| Location | Config File | Use Case |
|----------|-------------|----------|
| Local | `./tspec.config.json` | Project-specific plugins (default) |
| Global | `~/.tspec/tspec.config.json` | Plugins used across all projects |

## Output Format

### Text Output

```
Successfully installed @tspec/http
Added to config: ./tspec.config.json
```

### JSON Output

```json
{
  "plugin": "@tspec/http",
  "installed": true,
  "configUpdated": true,
  "configPath": "./tspec.config.json"
}
```

## Exit Codes

| Code | Description |
|------|-------------|
| `0` | Success |
| `1` | Installation failed |
| `2` | Error (invalid plugin name, network error, etc.) |

## Troubleshooting

### Plugin Not Found

```
Failed to install @tspec/nonexistent: Package not found
```

- Verify the package name is correct
- Check if the package exists on npm

### Permission Denied

```
Failed to install @tspec/http: EACCES permission denied
```

- Check write permissions for the plugins directory
- Try running with appropriate permissions

### Already Installed

```
Plugin @tspec/http is already installed and configured.
```

The plugin is already available in your environment.

## Related Commands

- [tspec plugin:list](./tspec-plugin-list.md) - List installed plugins
- [tspec list](./tspec-list.md) - List supported protocols