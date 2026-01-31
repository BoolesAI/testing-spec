# TSpec Coverage Examples

## Basic Coverage Analysis

### Full Project Coverage

Analyze all tspec files against all source files:

```bash
# Step 1: Find all tspec files
# Using Glob: pattern="**/*.tspec"

# Step 2: Parse tspec files to extract metadata
tspec parse "tests/**/*.tspec" --output json

# Step 3: Find all source files
# Using Glob: pattern="**/*.{ts,js}"  path="src/"

# Step 4: Generate coverage report (manual comparison)
```

### Sample Output

```markdown
# TSpec Coverage Report

Generated: 2024-01-15 10:30:00

## Summary

| Metric | Value |
|--------|-------|
| Total Source Files | 12 |
| Covered Files | 8 |
| Uncovered Files | 4 |
| File Coverage | 66.7% |
| Total TSpec Files | 15 |

## Uncovered Files

- src/utils/dateFormatter.ts
- src/utils/currencyFormatter.ts
- src/middleware/errorHandler.ts
- src/config/database.ts
```

## Directory-Scoped Analysis

### Controllers Only

Focus coverage analysis on controller files:

```bash
# TSpec files for controllers
tests/controllers/**/*.tspec

# Source files to check
src/controllers/**/*.ts
```

### Sample Controller Coverage Report

```markdown
# Controller Coverage Report

## Summary

| Metric | Value |
|--------|-------|
| Total Controllers | 5 |
| Covered Controllers | 4 |
| Coverage | 80.0% |

## File Coverage Details

| Controller | Status | Tests | Lines |
|------------|--------|-------|-------|
| books.ts | Covered | 4 | 1-120 |
| users.ts | Covered | 3 | 1-80 |
| orders.ts | Covered | 5 | 1-150 |
| auth.ts | Covered | 2 | 10-50 |
| admin.ts | Uncovered | 0 | - |
```

### Services Coverage

```markdown
# Service Coverage Report

## Summary

| Metric | Value |
|--------|-------|
| Total Services | 6 |
| Covered Services | 3 |
| Coverage | 50.0% |

## Uncovered Services

- src/services/emailService.ts
- src/services/notificationService.ts
- src/services/cacheService.ts
```

## Line-Level Coverage Details

### Detailed Line Analysis

```markdown
## Line Coverage: src/controllers/books.ts

Total lines: 150
Covered lines: 100-120 (estimated from ranges)
Coverage: ~75%

| Lines | TSpec File | Test Description |
|-------|------------|------------------|
| 5-25 | create_book_success.http.tspec | Create book with valid data |
| 5-25 | create_book_validation.http.tspec | Create book validation errors |
| 30-50 | get_book_success.http.tspec | Get book by ID |
| 30-50 | get_book_not_found.http.tspec | Get non-existent book |
| 55-75 | update_book_success.http.tspec | Update book details |
| 80-100 | delete_book_success.http.tspec | Delete book |
| 105-125 | list_books_paginated.http.tspec | List books with pagination |
| 130-150 | **UNCOVERED** | Search books endpoint |
```

### Gap Identification

```markdown
## Coverage Gaps

### src/controllers/books.ts

**Untested code blocks:**
- Lines 130-150: Search functionality
  - Recommendation: Create `search_books.http.tspec`

### src/services/orderService.ts

**Untested code blocks:**
- Lines 80-120: Order cancellation logic
  - Recommendation: Create `cancel_order_*.http.tspec` tests
- Lines 150-180: Refund processing
  - Recommendation: Create `process_refund_*.http.tspec` tests
```

## Sample Complete Report

```markdown
# TSpec Coverage Report

Generated: 2024-01-15 14:22:00
Project: bookstore-api

## Executive Summary

| Metric | Value | Status |
|--------|-------|--------|
| File Coverage | 72.0% | Warning |
| Total Source Files | 25 | - |
| Covered Files | 18 | - |
| Uncovered Files | 7 | Action Needed |
| Total TSpec Files | 42 | - |

## Coverage by Directory

| Directory | Files | Covered | Coverage |
|-----------|-------|---------|----------|
| src/controllers/ | 5 | 5 | 100% |
| src/services/ | 8 | 5 | 62.5% |
| src/middleware/ | 4 | 2 | 50% |
| src/utils/ | 6 | 4 | 66.7% |
| src/routes/ | 2 | 2 | 100% |

## Detailed File Coverage

### Controllers (100% Covered)

| File | Tests | Lines Covered |
|------|-------|---------------|
| books.ts | 8 | 1-150 |
| users.ts | 6 | 1-120 |
| orders.ts | 10 | 1-200 |
| auth.ts | 4 | 1-80 |
| admin.ts | 3 | 1-60 |

### Services (62.5% Covered)

| File | Status | Tests | Lines |
|------|--------|-------|-------|
| bookService.ts | Covered | 4 | 1-100 |
| userService.ts | Covered | 3 | 1-80 |
| orderService.ts | Partial | 5 | 1-80 |
| authService.ts | Covered | 2 | 1-60 |
| paymentService.ts | Covered | 3 | 1-120 |
| emailService.ts | Uncovered | 0 | - |
| notificationService.ts | Uncovered | 0 | - |
| cacheService.ts | Uncovered | 0 | - |

## Uncovered Files (Priority Order)

### High Priority
- `src/services/emailService.ts` - Email notifications (security relevant)
- `src/middleware/rateLimiter.ts` - Rate limiting (security relevant)

### Medium Priority
- `src/services/notificationService.ts` - Push notifications
- `src/middleware/cors.ts` - CORS configuration

### Low Priority
- `src/utils/formatters.ts` - Utility functions
- `src/services/cacheService.ts` - Cache layer
- `src/utils/constants.ts` - Constant values

## Recommendations

1. **Immediate Action**: Create tests for `emailService.ts` and `rateLimiter.ts`
2. **Sprint Planning**: Add notification tests to backlog
3. **Tech Debt**: Utilities can be tested as part of integration tests

## Line Coverage Gaps

### src/services/orderService.ts (Partial Coverage)

| Section | Lines | Status | Action |
|---------|-------|--------|--------|
| Create order | 1-40 | Covered | - |
| Get order | 41-60 | Covered | - |
| Update order | 61-80 | Covered | - |
| Cancel order | 81-120 | Uncovered | Create test |
| Refund order | 121-160 | Uncovered | Create test |
| Order history | 161-200 | Covered | - |
```

## Interpreting Coverage Results

### Good Coverage Indicators

- File coverage > 80%
- All controllers covered
- Critical services (auth, payment) fully covered
- No high-risk uncovered files

### Warning Signs

- File coverage < 60%
- Security-related files uncovered
- Core business logic gaps
- Many partial coverage files

### Action Items Based on Results

| Coverage Level | Action |
|----------------|--------|
| > 80% | Maintain, focus on edge cases |
| 60-80% | Target uncovered files in next sprint |
| 40-60% | Create test plan, prioritize critical paths |
| < 40% | Major test initiative needed |

## Integration with CI/CD

### Coverage Gate Example

```yaml
# Example: Fail build if coverage drops below threshold
coverage-check:
  script: |
    # Generate coverage report
    # Parse summary metrics
    # Fail if coverage < 70%
```

### Trend Tracking

Save reports with timestamps to track improvement:

```
reports/
├── coverage-2024-01-01.md
├── coverage-2024-01-08.md
├── coverage-2024-01-15.md
└── coverage-2024-01-22.md
```
