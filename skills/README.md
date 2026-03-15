# TSpec Skills

This directory contains the unified TSpec skill that provides comprehensive capabilities for working with `.tcase` test files and `.tsuite` suite files. The skill covers the full testing lifecycle from test generation through execution and coverage analysis.

## Unified Skill

| Skill | Description |
|-------|-------------|
| [tspec](./tspec/SKILL.md) | Comprehensive TSpec toolkit: list protocols, validate syntax, parse tests, run tests, generate test cases, analyze coverage, manage plugins, and MCP server |

## Capabilities

The **tspec** skill provides nine integrated capabilities:

### 1. List Protocols (tspec list)

List supported protocols and TSpec configuration information. Use this to:
- Discover available protocols (HTTP, gRPC, etc.)
- Verify TSpec installation
- Check protocol capabilities and status

**MCP Tool:** `tspec_list`

### 2. Validate Test Files (tspec validate)

Validate `.tcase` and `.tsuite` files for schema correctness without executing tests. Use this to:
- Check YAML syntax and structure
- Validate required fields and protocol blocks
- Verify assertion types and operators
- Validate suite structure and test references
- Pre-commit hook validation
- CI/CD linting stages

**MCP Tool:** `tspec_validate`

**Supported Assertion Types:**
- `json_path`, `string`, `number`, `regex`, `xml_path`, `response_time`, `javascript`, `file_exist`, `file_read`, `exception`

### 3. Parse Test Files (tspec parse)

Parse and display TSpec test case information without executing any requests. Use this to:
- Debug variable substitution
- Inspect request payloads before execution
- Understand template inheritance
- Verify data-driven test expansion

**MCP Tool:** `tspec_parse`

### 4. Run Tests (tspec run)

Execute TSpec test cases and suites against API endpoints. Use this to:
- Run individual `.tcase` test files
- Execute `.tsuite` files with lifecycle hooks
- Validate responses against assertions
- Run nested suites with proper hook execution order
- Generate pass/fail reports with detailed assertion feedback
- CI/CD test automation
- Execute tests through remote proxy servers

**MCP Tool:** `tspec_run`

### 5. Generate Test Cases (tspec-gen)

Generate TSpec test cases from source code changes. Use this to:
- Create tests from git diff changes
- Generate tests from explicit file paths
- Build comprehensive test suites for new endpoints
- Include proper `related_code` metadata for coverage tracking

### 6. Analyze Test Coverage (tspec-coverage)

Analyze TSpec test coverage based on `metadata.related_code`. Use this to:
- Generate coverage reports showing tested vs untested files
- Identify coverage gaps at file and line level
- Track coverage trends over time
- Prioritize test creation efforts

### 7. List Plugins (tspec plugin:list)

List installed TSpec plugins and their status. Use this to:
- View installed plugins and versions
- Check plugin health status
- Verify plugin installation

**CLI Command:** `tspec plugin:list` (alias: `tspec plugins`)

### 8. Install Plugins (tspec plugin:install)

Install TSpec plugins from npm or local packages. Use this to:
- Install plugins from npm registry
- Install local plugin packages
- Manage plugin installation globally or locally

**CLI Command:** `tspec plugin:install` (alias: `tspec install`)

### 9. MCP Server (tspec mcp)

Start the Model Context Protocol (MCP) server for AI tool integration. Use this to:
- Expose TSpec capabilities to AI assistants
- Enable programmatic test execution
- Integrate with Claude Desktop and other MCP clients

**CLI Command:** `tspec mcp`

**Available MCP Tools:** `tspec_list`, `tspec_validate`, `tspec_parse`, `tspec_run`

## Typical Workflow

```
tspec-gen        # Generate tests from code changes
       |
       v
tspec list       # Check available protocols
       |
       v
tspec validate   # Validate test file syntax
       |
       v
tspec parse      # Inspect test structure (optional)
       |
       v
tspec run        # Execute tests
       |
       v
tspec-coverage   # Analyze coverage (optional)
```

## Proxy Execution

All execution capabilities (run, validate, parse) support remote proxy execution. Configure proxy in `tspec.config.json`:

```json
{
  "proxy": {
    "url": "http://tspec-proxy.example.com:8080",
    "timeout": 60000,
    "headers": {
      "Authorization": "Bearer ${TSPEC_PROXY_TOKEN}"
    }
  }
}
```

Use `--no-proxy` to disable or `--proxy-url <url>` to override. See [tspec skill documentation](./tspec/SKILL.md#proxy-execution) for details.

## Slash Command Triggers

The tspec skill responds to various triggers:
- `/tspec-list` - List supported protocols
- `/tspec-gen` - Generate test cases from code
- `/tspec-coverage` - Analyze test coverage

## Directory Structure

```
skills/
├── README.md                    # This file
└── tspec/
    ├── SKILL.md                 # Unified skill documentation
    ├── reference/               # Detailed per-command documentation
    │   ├── tspec-list.md
    │   ├── tspec-validate.md
    │   ├── tspec-parse.md
    │   ├── tspec-run.md
    │   ├── tspec-gen.md
    │   ├── tspec-coverage.md
    │   ├── tspec-plugin-list.md
    │   ├── tspec-plugin-install.md
    │   └── tspec-mcp.md
    └── examples/
        └── example.md           # Comprehensive examples
```
