# Test Files & Code References
**Generated**: 2026-01-07 @ 16:10 UTC

---

## Test Files Location

### 1. Generation Log Tests (✅ 20/20 PASSING)
**Path**: `/Users/lmtnolimit/working/ai-section-generator/app/services/__tests__/generation-log.server.test.ts`

**Size**: 8,182 bytes
**Modified**: 2026-01-07 16:08 UTC
**Status**: Perfect coverage (100% stmts | 100% branch | 100% funcs)

**Test Categories**:
- Creation and logging functionality
- Date-based filtering
- Shop-based filtering
- Count operations
- Edge cases and error scenarios

---

### 2. Feature Gate Tests (✅ 27/27 PASSING)
**Path**: `/Users/lmtnolimit/working/ai-section-generator/app/services/__tests__/feature-gate.server.test.ts`

**Size**: 13,232 bytes
**Modified**: 2026-01-07 15:39 UTC
**Status**: Excellent coverage (98.24% stmts | 92.85% branch | 100% funcs)
**Uncovered**: Line 53 (edge case - type narrowing)

**Test Categories**:
- Feature availability by tier
- Trial period checks
- Plan tier validation
- Feature flag evaluation
- Complex conditional logic

---

### 3. Billing Tests (❌ 46/47 PASSING - 1 FAILURE)
**Path**: `/Users/lmtnolimit/working/ai-section-generator/app/services/__tests__/billing.server.test.ts`

**Size**: 10,798 bytes
**Modified**: 2026-01-07 16:09 UTC
**Status**: 1 failure out of 47 tests (97.9% pass rate)
**Coverage**: 0% (all tested via mocks)

**Failing Test**:
- Line 210-221: "does NOT fall back if GenerationLog exists but is zero this month"
- Assertion fails at line 220: `expect(mockedSection.count).not.toHaveBeenCalled()`
- Error: section.count() was called 1 time (expected 0)

---

## Implementation Files

### 1. Billing Service (Contains the bug)
**Path**: `/Users/lmtnolimit/working/ai-section-generator/app/services/billing.server.ts`

**Relevant Function**: `checkQuota()` (exported)
**Location**: Lines 422-489
**Issue Location**: Lines 447-462 (fallback logic)

**Code Snippet - Problem Area**:
```typescript
// Lines 437-462
// Primary: Count GenerationLog
let freeUsageCount = await prisma.generationLog.count({
  where: {
    shop,
    generatedAt: { gte: startOfMonth },  // Line 441
  },
});

// Fallback: If no GenerationLog exists yet (migration period),
// use Section.count as before
if (freeUsageCount === 0) {                              // Line 447
  const legacyCount = await prisma.section.count({       // Line 448 ← PROBLEM
    where: {
      shop,
      createdAt: { gte: startOfMonth },
    },
  });
  // Only use legacy if GenerationLog is truly empty
  // (not just zero usage this month)
  const hasAnyLogs = await prisma.generationLog.count({  // Line 456
    where: { shop },
  });
  if (hasAnyLogs === 0) {                                // Line 459
    freeUsageCount = legacyCount;
  }
}
```

**Problem**: Line 448 calls `section.count()` BEFORE line 456 checks if logs exist

---

### 2. Generation Log Service
**Path**: `/Users/lmtnolimit/working/ai-section-generator/app/services/generation-log.server.ts`

**Size**: ~200 lines (new file)
**Status**: Fully tested (100% coverage)
**Functions**:
- `recordGeneration()` - Creates generation log entries
- `getGenerationLog()` - Retrieves specific logs
- Various counting and filtering functions

---

### 3. Feature Gate Service
**Path**: `/Users/lmtnolimit/working/ai-section-generator/app/services/feature-gate.server.ts`

**Relevant Code**: Integration with billing/quota system
**Status**: Well tested (98.24% coverage)
**Key Function**: Uses quota checks from billing.server.ts

---

## Database Files (Schema)

**Path**: `/Users/lmtnolimit/working/ai-section-generator/prisma/schema.prisma`

**Relevant Models**:
- `GenerationLog` - Records all AI section generations
- `Section` - Stores section documents
- `Subscription` - Subscription/billing info
- `PlanConfiguration` - Plan tiers and limits

---

## Test Configuration Files

**Jest Config** (likely in):
- `package.json` (testEnvironment, testMatch patterns)
- `jest.config.js` (if exists)
- `tsconfig.json` (TypeScript config for tests)

**Mock Setup Location**: Each test file
- Line 6-33 in billing.server.test.ts shows Prisma mock setup
- Pattern: `jest.mock('../../db.server', ...)`

---

## Test Execution Commands

### Full Suite
```bash
npm test -- --testPathPatterns="(generation-log|billing|feature-gate)" --coverage
```
- **Executes**: All 3 test suites
- **Output**: 47 tests, coverage report
- **Time**: ~2.5 seconds

### Individual Suites
```bash
# Generation Log
npm test -- --testPathPatterns="generation-log" --coverage

# Feature Gate
npm test -- --testPathPatterns="feature-gate" --coverage

# Billing
npm test -- --testPathPatterns="billing" --coverage
```

### Failing Test Only
```bash
npm test -- --testPathPatterns="billing" --testNamePattern="does NOT fall back"
```

---

## Coverage Report Locations

The coverage report is generated in memory during test execution. To save it:

```bash
npm test -- --testPathPatterns="(generation-log|billing|feature-gate)" --coverage --coverageDirectory=/tmp/coverage
```

Coverage metrics extracted from test output:
- Overall: 19.01% statements | 15.92% branches | 15.78% functions | 18.47% lines
- generation-log.server.ts: 100% all metrics
- feature-gate.server.ts: 98.24% statements, 92.85% branches, 100% functions
- billing.server.ts: 0% (mocked in tests)

---

## Fix Implementation Location

**File to Modify**: `/Users/lmtnolimit/working/ai-section-generator/app/services/billing.server.ts`

**Lines to Reorder**: 447-462

**Current Order**:
1. Line 447: `if (freeUsageCount === 0)`
2. Line 448: `const legacyCount = await prisma.section.count(...)` ← Move down
3. Line 456: `const hasAnyLogs = await prisma.generationLog.count(...)` ← Move up

**Correct Order** (after fix):
1. Line 447: `if (freeUsageCount === 0)`
2. NEW: `const hasAnyLogs = await prisma.generationLog.count(...)`
3. NEW: `if (hasAnyLogs === 0)` (move to here)
4. MOVED: `const legacyCount = await prisma.section.count(...)`

---

## Git Status (Before Fix)

```
Modified files:
 M app/services/__tests__/feature-gate.server.test.ts
 M app/services/billing.server.ts           ← File to fix
 M app/services/__tests__/billing.server.test.ts
?? app/services/generation-log.server.ts    ← New file

Deleted files (from migration):
 D app/services/__tests__/trial.server.test.ts
 D app/services/trial.server.ts
```

---

## Test Reports Generated

All reports in: `/Users/lmtnolimit/working/ai-section-generator/plans/reports/`

1. **tester-260107-1610-billing-test-results.md** (Main report)
   - Full test execution results
   - Coverage analysis
   - Failure details
   - Recommendations

2. **tester-260107-1610-quick-summary.md** (Executive summary)
   - Quick overview
   - Key metrics
   - Action items

3. **tester-260107-1610-detailed-failure-analysis.md** (Deep dive)
   - Detailed code flow analysis
   - Why it fails
   - Fix strategies
   - Verification checklist

4. **tester-260107-1610-metrics-summary.txt** (Metrics)
   - Raw metrics
   - Performance data
   - Priority recommendations
   - Command reference

5. **tester-260107-1610-file-references.md** (This file)
   - File locations
   - Code snippets
   - Fix locations

---

## Next Steps

1. **Review** detailed failure analysis (detailed-failure-analysis.md)
2. **Locate** the code to fix (billing.server.ts:447-462)
3. **Implement** fix (reorder logic)
4. **Re-run** tests to verify
5. **Commit** changes with reference to this report

