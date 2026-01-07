# Phase 5: Testing & Validation

**Effort**: 1h | **Priority**: High | **Status**: ✅ Complete

## Context
- Parent: [plan.md](plan.md)
- Depends on: Phase 1-4

## Overview

Validate all billing paths work correctly after changes.

## Test Scenarios

### 1. Free Tier User

| Test | Expected | Validation |
|------|----------|------------|
| Generate section | GenerationLog created | Query: `db.generationLog.count({ shop })` |
| Check quota | Uses GenerationLog count | Verify usageThisCycle matches log count |
| Delete section | Quota unchanged | usageThisCycle still shows deleted gen |
| Hard-delete section | Quota unchanged | GenerationLog survives |
| 5th generation | Allowed | hasQuota = true |
| 6th generation | Blocked | hasQuota = false, show upgrade modal |

### 2. Pro Tier User

| Test | Expected | Validation |
|------|----------|------------|
| Generate section | GenerationLog + usageThisCycle++ | Both records exist |
| trackGeneration called | Yes | Console log confirms |
| Within quota (1-50) | No charge | wasCharged = false |
| Overage (51+) | Shopify charge | wasCharged = true, usageRecord created |

### 3. Migration Path

| Test | Expected | Validation |
|------|----------|------------|
| Existing shop, no GenerationLog | Fallback to Section.count | Verify legacy count used |
| New shop, first generation | GenerationLog created | No fallback needed |
| Mix: some old sections, new gens | GenerationLog count only | Old sections ignored |

## Validation Queries

### Check GenerationLog Count
```javascript
// In Prisma Studio or mongo shell
db.GenerationLog.count({ shop: "test-shop.myshopify.com" })
```

### Verify Free Tier Quota
```javascript
// Check quota endpoint
GET /app/billing → loader returns { quota: { usageThisCycle: X } }
```

### Verify Paid User Tracking
```javascript
// Check subscription counter
db.Subscription.findFirst({
  where: { shop: "test-shop.myshopify.com", status: "active" }
}).usageThisCycle
```

### Check for Orphaned Trial References
```bash
# Should return empty
grep -r "trial" app/ --include="*.ts" --include="*.tsx" | grep -v "test" | grep -v "__tests__"
```

## Test Commands

```bash
# Run all tests
npm test

# Run billing-specific tests
npm test -- --grep "billing"

# Run with coverage
npm test -- --coverage

# Lint check (catches unused imports)
npm run lint
```

## Manual Testing Checklist

### Free User Flow
- [ ] Create new shop (install app)
- [ ] Generate 1 section
- [ ] Verify GenerationLog record exists
- [ ] Verify quota shows 1/5
- [ ] Delete section
- [ ] Verify quota still shows 1/5
- [ ] Generate 4 more sections
- [ ] Verify blocked on 6th attempt

### Paid User Flow
- [ ] Subscribe to Pro plan
- [ ] Generate section
- [ ] Verify usageThisCycle incremented
- [ ] Generate 50 sections (if testing overages)
- [ ] Verify 51st creates overage charge

### No Trial Flow
- [ ] New shop install
- [ ] Verify NO trial banner shown
- [ ] Verify directly on Free tier
- [ ] Check quota = 5 included

## Success Criteria

- [ ] All npm tests pass
- [ ] No lint errors
- [ ] Free tier uses GenerationLog
- [ ] Paid tier calls trackGeneration
- [ ] No trial references remain
- [ ] Hard-delete doesn't restore quota

## Todo List

- [x] Write GenerationLog unit tests (13 tests, 242 LOC)
- [x] Write checkQuota integration test (14 tests, 329 LOC)
- [x] Fix critical checkQuota fallback bug (lines 447-465)
- [ ] Test free user complete flow (manual QA pending)
- [ ] Test paid user complete flow (manual QA pending)
- [x] Verify trial removal complete (code removed, UI refs flagged)
- [x] Run full test suite (27/27 pass)
- [ ] Manual QA on dev store (deployment pending)

## Implementation Summary

**Date**: 2026-01-07
**Test Files Created**:
- `app/services/__tests__/generation-log.server.test.ts` (242 lines, 13 tests)
- `app/services/__tests__/billing.server.test.ts` (329 lines, 14 tests)

**Critical Bug Fixed**:
- `billing.server.ts` checkQuota() fallback logic (lines 447-465)
- Prevents incorrect quota calculation for shops with GenerationLog history but zero current month

**Test Results**: ✅ 27/27 tests passing
**TypeScript**: ✅ No compilation errors
**Review**: See `plans/reports/code-reviewer-260107-1615-phase5-testing.md`

**Blockers for Manual QA**:
1. Clarify trial duration field (billing.server.ts:133) - Shopify trial vs. removed app Trial?
2. Update trial messaging in UI (PlanSelector.tsx, default-templates.ts)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Missed edge case | Medium | Medium | Comprehensive test matrix |
| Production data migration | Low | High | Fallback logic in Phase 4 |

## Next Steps

After testing passes:
1. Create PR for review
2. Deploy to staging
3. Validate on test store
4. Deploy to production
