# TSpec Skills

This directory contains TSpec skills that provide specialized capabilities for working with `.tspec` test files. Each skill corresponds to an MCP tool and CLI command.

## Available Skills

| Skill | Description | MCP Tool |
|-------|-------------|----------|
| [tspec-list](./tspec-list/SKILL.md) | List supported protocols and TSpec configuration | `tspec_list` |
| [tspec-parse](./tspec-parse/SKILL.md) | Parse and display test case information without execution | `tspec_parse` |
| [tspec-validate](./tspec-validate/SKILL.md) | Validate .tspec files for schema correctness | `tspec_validate` |
| [tspec-run](./tspec-run/SKILL.md) | Execute TSpec test cases and report results | `tspec_run` |

## Skill Overview

### tspec-list

List supported protocols and TSpec configuration information. Use this skill to:
- Discover available protocols (HTTP, gRPC, etc.)
- Verify TSpec installation
- Check protocol capabilities and status

### tspec-parse

Parse and display TSpec test case information without executing any requests. Use this skill to:
- Debug variable substitution
- Inspect request payloads before execution
- Understand template inheritance
- Verify data-driven test expansion

### tspec-validate

Validate `.tspec` files for schema correctness without executing tests. Use this skill to:
- Check YAML syntax and structure
- Validate required fields and protocol blocks
- Pre-commit hook validation
- CI/CD linting stages

### tspec-run

Execute TSpec test cases against API endpoints and report results. Use this skill to:
- Run HTTP and gRPC tests
- Validate responses against assertions
- Generate pass/fail reports
- CI/CD test automation

## Typical Workflow

```
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
```

## Directory Structure

```
skills/
├── README.md                    # This file
├── tspec-list/
│   ├── SKILL.md                 # Skill documentation
│   └── references/
│       └── examples.md          # Usage examples
├── tspec-parse/
│   ├── SKILL.md
│   └── references/
│       └── examples.md
├── tspec-validate/
│   ├── SKILL.md
│   └── references/
│       └── examples.md
└── tspec-run/
    ├── SKILL.md
    └── references/
        └── examples.md
```
