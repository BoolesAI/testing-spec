---
name: tspec-coverage
description: Analyze TSpec test coverage based on related_code metadata. Use for coverage reports, identifying untested code, and test gap analysis. Keywords: test coverage, coverage report, related code, untested files, coverage analysis, gap analysis
---

# TSpec Coverage

## Overview

Analyze TSpec test coverage by examining the `metadata.related_code` field across all `.tspec` files. This skill guides you through generating coverage reports that show which source files and lines have corresponding tests.

Use this skill when:
- Reviewing test coverage before release
- Identifying untested code areas
- Planning test creation efforts
- Tracking coverage improvements over time

## Analysis Approach

1. **Scan TSpec Files**
   - Find all `.tspec` files in the project
   - Use glob patterns to match test directories

2. **Extract related_code**
   - Parse each `.tspec` file's metadata section
   - Extract `related_code` array entries
   - Parse file paths and line references

3. **Parse Line References**
   - Plain path: `"src/auth/login.js"` - entire file
   - Single line: `"src/auth/login.js[42]"` - line 42
   - Line range: `"src/auth/login.js[10-20]"` - lines 10-20
   - Multiple: `"src/auth/login.js[1,5-10,20]"` - lines 1, 5-10, 20

4. **Cross-Reference Source Files**
   - Find all source files in the project
   - Compare against covered files from tspec metadata
   - Calculate coverage statistics

5. **Generate Report**
   - Summary statistics
   - File-level coverage table
   - Line-level coverage details
   - Untested files list

## Workflow

### Step 1: Find All TSpec Files

```bash
# Using Glob tool
pattern: "**/*.tspec"
path: "tests/"
```

Or use `tspec_parse` MCP tool:

```json
{
  "files": ["tests/**/*.tspec"],
  "output": "json"
}
```

### Step 2: Extract Metadata

For each tspec file, extract `metadata.related_code`:

```yaml
metadata:
  related_code:
    - "src/controllers/books.ts"
    - "src/services/bookService.ts[10-50]"
```

### Step 3: Find Source Files

```bash
# Using Glob tool
pattern: "**/*.{ts,js,py,go}"
path: "src/"
```

### Step 4: Generate Coverage Report

Compare covered files against source files and generate report.

## Report Format

The coverage report is generated in Markdown format:

```markdown
# TSpec Coverage Report

Generated: 2024-01-15 10:30:00

## Summary

| Metric | Value |
|--------|-------|
| Total Source Files | 25 |
| Covered Files | 18 |
| Uncovered Files | 7 |
| File Coverage | 72.0% |
| Total TSpec Files | 42 |

## File Coverage Details

| Source File | Status | TSpec Files | Lines Covered |
|-------------|--------|-------------|---------------|
| src/controllers/books.ts | Covered | 4 | 1-50, 75-100 |
| src/controllers/users.ts | Covered | 3 | 10-30 |
| src/services/auth.ts | Partial | 1 | 5-20 |
| src/utils/validation.ts | Uncovered | 0 | - |

## Uncovered Files

The following source files have no corresponding TSpec tests:

- src/utils/validation.ts
- src/utils/formatting.ts
- src/middleware/rateLimit.ts
- src/services/emailService.ts

## Line Coverage Details

### src/controllers/books.ts

| Lines | TSpec File | Description |
|-------|------------|-------------|
| 1-25 | create_book_success.http.tspec | Create book endpoint |
| 26-50 | get_book_success.http.tspec | Get book by ID |
| 75-100 | update_book_success.http.tspec | Update book |
| 51-74 | **UNCOVERED** | Delete book endpoint |

### src/controllers/users.ts

| Lines | TSpec File | Description |
|-------|------------|-------------|
| 10-30 | create_user_success.http.tspec | User registration |
| 31-60 | **UNCOVERED** | User profile endpoints |
```

## Report Sections

### Summary

High-level metrics:
- **Total Source Files**: All source files in scope
- **Covered Files**: Files with at least one `related_code` reference
- **Uncovered Files**: Files with no test coverage
- **File Coverage**: Percentage of covered files
- **Total TSpec Files**: Number of test files analyzed

### File Coverage Details

Table showing each source file with:
- **Status**: Covered, Partial, or Uncovered
- **TSpec Files**: Count of tests referencing this file
- **Lines Covered**: Specific line ranges covered

### Uncovered Files

List of source files with no corresponding tests, useful for:
- Prioritizing test creation
- Identifying coverage gaps
- Planning test sprints

### Line Coverage Details

Detailed breakdown showing:
- Which lines are covered by which tests
- Gaps in line coverage within files
- Test descriptions for context

## Common Use Cases

### Pre-Release Coverage Check

Before a release, analyze coverage to ensure critical code is tested:

1. Find all tspec files
2. Extract coverage data
3. Generate report
4. Review uncovered files for risk

### Identify Coverage Gaps

Find areas needing more tests:

1. Generate coverage report
2. Focus on "Uncovered Files" section
3. Check "Line Coverage Details" for partial coverage
4. Create tests using `tspec-gen` skill

### Track Coverage Trends

Compare coverage over time:

1. Generate report periodically
2. Save reports with timestamps
3. Compare summary metrics
4. Track file coverage changes

### Directory-Scoped Analysis

Analyze coverage for specific directories:

```bash
# Only analyze controllers
tspec files: tests/controllers/**/*.tspec
source files: src/controllers/**/*.ts
```

## Interpreting Results

### Coverage Status

| Status | Meaning |
|--------|---------|
| **Covered** | File has tests with line references |
| **Partial** | File referenced but not all code tested |
| **Uncovered** | No tests reference this file |

### Priority for New Tests

1. **Critical uncovered files**: Core business logic, auth, payments
2. **Partial coverage**: Expand existing tests
3. **Low-risk uncovered**: Utilities, helpers (lower priority)

### False Positives

The `related_code` analysis may show:
- **Over-coverage**: Tests referencing utility files used by many endpoints
- **Under-coverage**: Tests without `related_code` metadata

## Related Skills

- [tspec-gen](../tspec-gen/SKILL.md) - Generate tests for uncovered code
- [tspec-parse](../tspec-parse/SKILL.md) - Parse tspec files to extract metadata
- [tspec-validate](../tspec-validate/SKILL.md) - Validate tspec syntax
- [tspec-run](../tspec-run/SKILL.md) - Execute tests
