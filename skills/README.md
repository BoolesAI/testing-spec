# TSpec Skills

This directory contains TSpec skills that provide specialized capabilities for working with `.tcase` test files and `.tsuite` suite files. Skills may correspond to MCP tools and CLI commands, or provide workflow guidance for test generation and analysis.

## Available Skills

| Skill | Description | MCP Tool |
|-------|-------------|----------|
| [tspec-list](./tspec-list/SKILL.md) | List supported protocols and TSpec configuration | `tspec_list` |
| [tspec-parse](./tspec-parse/SKILL.md) | Parse and display test case information without execution | `tspec_parse` |
| [tspec-validate](./tspec-validate/SKILL.md) | Validate .tcase and .tsuite files for schema correctness | `tspec_validate` |
| [tspec-run](./tspec-run/SKILL.md) | Execute TSpec test cases and suites | `tspec_run` |
| [tspec-gen](./tspec-gen/SKILL.md) | Generate TSpec test cases from code changes | - |
| [tspec-coverage](./tspec-coverage/SKILL.md) | Analyze test coverage from related_code metadata | - |

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

Validate `.tcase` and `.tsuite` files for schema correctness without executing tests. Use this skill to:
- Check YAML syntax and structure
- Validate required fields and protocol blocks
- Verify assertion types and operators
- Validate suite structure and test references
- Pre-commit hook validation
- CI/CD linting stages

**Supported Assertion Types:**
- `json_path`, `string`, `number`, `regex`, `xml_path`, `response_time`, `javascript`, `file_exist`, `file_read`, `exception`

### tspec-run

Execute TSpec test cases and suites against API endpoints. Use this skill to:
- Run individual `.tcase` test files
- Execute `.tsuite` files with lifecycle hooks
- Validate responses against assertions
- Run nested suites with proper hook execution order
- Generate pass/fail reports with detailed assertion feedback
- CI/CD test automation

### tspec-gen

Generate TSpec test cases from source code changes. Use this skill to:
- Create tests from git diff changes
- Generate tests from explicit file paths
- Build comprehensive test suites for new endpoints
- Include proper `related_code` metadata for coverage tracking

### tspec-coverage

Analyze TSpec test coverage based on `metadata.related_code`. Use this skill to:
- Generate coverage reports showing tested vs untested files
- Identify coverage gaps at file and line level
- Track coverage trends over time
- Prioritize test creation efforts

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
├── tspec-run/
│   ├── SKILL.md
│   └── references/
│       └── examples.md
├── tspec-gen/
│   ├── SKILL.md
│   └── references/
│       └── examples.md
└── tspec-coverage/
    ├── SKILL.md
    └── references/
        └── examples.md
```
