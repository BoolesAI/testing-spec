---
name: tspec
description: Comprehensive TSpec testing toolkit for .tcase and .tsuite files. List protocols, validate syntax, parse test structure, run tests, generate test cases from code changes, and analyze test coverage. Supports explicit protocol declaration via the `protocol` field and auto-detection from protocol blocks (http, grpc, graphql, websocket, web). Use for API testing, test generation, coverage analysis, and test lifecycle management. Keywords: tspec, test case, test suite, api testing, test validation, test generation, test coverage, run tests, parse tests, list protocols, tspec run, tspec validate, tspec parse, tspec list, tspec gen, tspec coverage, http tests, grpc tests, tsuite, related code, smoke test, regression test, test automation, mcp, plugin
---

# TSpec - Comprehensive Testing Toolkit

## Overview

TSpec is a YAML-based DSL for API test specification designed for Developer + AI collaboration. Supports explicit protocol declaration via the `protocol` field and auto-detection from protocol blocks (http, grpc, graphql, websocket, web). This unified skill covers the full testing lifecycle: listing available protocols, validating test file syntax, parsing test structure, executing tests, generating test cases from code changes, and analyzing test coverage.

Nine integrated capabilities are provided:

| # | Capability | MCP Tool | Reference |
|---|-----------|----------|-----------|
| 1 | List Protocols | `tspec_list` | [tspec-list](reference/tspec-list.md) |
| 2 | Validate Test Files | `tspec_validate` | [tspec-validate](reference/tspec-validate.md) |
| 3 | Parse Test Files | `tspec_parse` | [tspec-parse](reference/tspec-parse.md) |
| 4 | Run Tests | `tspec_run` | [tspec-run](reference/tspec-run.md) |
| 5 | Generate Test Cases | - | [tspec-gen](reference/tspec-gen.md) |
| 6 | Analyze Test Coverage | - | [tspec-coverage](reference/tspec-coverage.md) |
| 7 | List Plugins | - | [tspec-plugin-list](reference/tspec-plugin-list.md) |
| 8 | Install Plugins | - | [tspec-plugin-install](reference/tspec-plugin-install.md) |
| 9 | MCP Server | - | [tspec-mcp](reference/tspec-mcp.md) |

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

---

## 1. List Protocols (tspec list)

Discover available protocols (HTTP, gRPC, etc.) and verify TSpec installation. See [full reference](reference/tspec-list.md).

**MCP Tool:** `tspec_list` | **Parameters:** `output` (json/text)

```bash
tspec list
tspec list --output json
```

---

## 2. Validate Test Files (tspec validate)

Check `.tcase` and `.tsuite` files for schema correctness without execution. Validates YAML syntax, required fields, protocol blocks, assertion types, metadata, and suite structure. See [full reference](reference/tspec-validate.md).

**MCP Tool:** `tspec_validate` | **Parameters:** `files` (required), `output`

**Supported assertion types:** `json_path`, `string`, `number`, `regex`, `xml_path`, `response_time`, `javascript`, `file_exist`, `file_read`, `exception`

```bash
tspec validate "tests/**/*.tcase"
tspec validate tests/*.tcase --output json
```

---

## 3. Parse Test Files (tspec parse)

Inspect test structure without execution. Resolves variables, expands templates, and shows final test configuration. See [full reference](reference/tspec-parse.md).

**MCP Tool:** `tspec_parse` | **Parameters:** `files` (required), `env`, `params`, `verbose`, `output`

```bash
tspec parse tests/login.http.tcase -v
tspec parse tests/*.tcase -e API_HOST=localhost --output json
```

---

## 4. Run Tests (tspec run)

Execute `.tcase` and `.tsuite` files against API endpoints with pass/fail reporting. Supports concurrent execution, lifecycle hooks, and fail-fast mode. See [full reference](reference/tspec-run.md).

**MCP Tool:** `tspec_run` | **Parameters:** `files` (required), `concurrency`, `env`, `params`, `failFast`, `output`

```bash
tspec run "tests/**/*.tcase" -e API_HOST=localhost:3000
tspec run tests/*.tcase --output json --fail-fast
```

---

## 5. Generate Test Cases (tspec-gen)

Generate `.tcase` test files from source code changes (git diff or explicit paths). Includes proper metadata, assertions, and `related_code` references. See [full reference](reference/tspec-gen.md).

**No MCP tool** - workflow guidance skill.

**File naming:** `{scenario}_{description}.{protocol}.tcase`

**Workflow:** Identify target code → Analyze source → Generate .tcase files → Validate with `tspec validate`

---

## 6. Analyze Test Coverage (tspec-coverage)

Analyze test coverage by examining `metadata.related_code` across `.tcase` files. Generates reports showing covered/uncovered source files and line-level gaps. See [full reference](reference/tspec-coverage.md).

**No MCP tool** - workflow guidance skill.

**Workflow:** Scan .tcase files → Extract related_code → Cross-reference source files → Generate report

---

## 7. List Plugins (tspec plugin:list)

List installed TSpec plugins and their status. Plugins extend TSpec with custom protocols, assertions, and lifecycle actions. See [full reference](reference/tspec-plugin-list.md).

**No MCP tool** - CLI command.

```bash
tspec plugin:list
tspec plugins          # alias
tspec plugin:list --health
```

---

## 8. Install Plugins (tspec plugin:install)

Install TSpec plugins from npm or local packages. See [full reference](reference/tspec-plugin-install.md).

**No MCP tool** - CLI command.

```bash
tspec plugin:install @tspec/plugin-custom
tspec install @tspec/plugin-custom    # alias
tspec plugin:install ./local-plugin --global
```

---

## 9. MCP Server (tspec mcp)

Start the Model Context Protocol (MCP) server for AI tool integration. Exposes TSpec capabilities to AI assistants like Claude. See [full reference](reference/tspec-mcp.md).

**No MCP tool** - this IS the MCP server command.

```bash
tspec mcp              # Start MCP server
```

**Available MCP Tools:** `tspec_list`, `tspec_validate`, `tspec_parse`, `tspec_run`

---

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

### Proxy CLI Options

```bash
# Override proxy URL
tspec run tests/*.tcase --proxy-url http://localhost:8080

# Disable proxy
tspec run tests/*.tcase --no-proxy
```

### DSL-Level Proxy Configuration

Override proxy settings directly in `.tcase` or `.tsuite` files:

```yaml
# .tcase file
proxy_server:
  url: "https://special-proxy.example.com"
  timeout: 60000
  headers:
    Authorization: "Bearer ${TSPEC_PROXY_TOKEN}"
  operations: ["run"]
```

```yaml
# .tsuite file
suite:
  name: "API Test Suite"
  proxy_server:
    url: "https://suite-proxy.example.com"
  tests:
    - file: "tests/test1.http.tcase"
```

**Precedence order:** Test case > Suite > CLI flags > Config file

When proxy is configured, operations are automatically forwarded to the remote server. The output includes a `[Proxy: <url>]` indicator.

---

## Cross-Capability Workflows

### Pre-Commit Validation Workflow

```bash
tspec validate $(git diff --cached --name-only --diff-filter=ACM | grep '.tcase$')
```

### Test Development Workflow

```bash
# 1. Generate tests from code changes (tspec-gen)
# 2. Validate generated tests
tspec validate "tests/**/*.tcase"
# 3. Parse to inspect structure
tspec parse tests/new_endpoint.http.tcase -v
# 4. Run tests
tspec run "tests/**/*.tcase" -e API_HOST=localhost:3000
```

### CI/CD Testing Pipeline

```bash
# 1. Validate all test files
tspec validate "tests/**/*.tcase" --output json
# 2. Run all tests
tspec run "tests/**/*.tcase" --output json --fail-fast
# 3. Generate coverage report (tspec-coverage)
```

### Coverage-Driven Test Generation

1. Run coverage analysis to identify gaps
2. Use `tspec-gen` to generate tests for uncovered code
3. Validate and parse new tests
4. Run full test suite
5. Re-run coverage to verify improvement
