# Phase 4: Update checkQuota for Free Tier

**Effort**: 2h | **Priority**: Critical | **Status**: Pending

## Context
- Parent: [plan.md](plan.md)
- Depends on: Phase 1-3

## Overview

Update `checkQuota()` to use GenerationLog count instead of Section.count() for free tier.

## Key Insights

- Current: Counts `Section` records (abusable via hard-delete)
- New: Counts `GenerationLog` records (immutable, no abuse vector)
- Backward compatible: Fallback to Section.count if no GenerationLog exists

## Requirements

**Functional**:
- Free tier quota based on GenerationLog count
- Paid tier unchanged (uses subscription.usageThisCycle)
- Backward compatible during migration period

**Non-functional**:
- Fast query (indexed by shop + generatedAt)

## Related Code Files

**Modify**:
- `app/services/billing.server.ts` - Update checkQuota function

## Implementation Steps

### 1. Update checkQuota in billing.server.ts

**Replace lines 446-475** (free tier section):

```typescript
// No subscription = free tier with limits from database
if (!subscription) {
  const freePlan = await prisma.planConfiguration.findUnique({
    where: { planName: "free" },
  });
  const freeQuota = freePlan?.includedQuota ?? 5;

  // Count from GenerationLog (immutable, survives section deletion)
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Primary: Count GenerationLog
  let freeUsageCount = await prisma.generationLog.count({
    where: {
      shop,
      generatedAt: { gte: startOfMonth },
    },
  });

  // Fallback: If no GenerationLog exists yet (migration period),
  // use Section.count as before
  if (freeUsageCount === 0) {
    const legacyCount = await prisma.section.count({
      where: {
        shop,
        createdAt: { gte: startOfMonth },
      },
    });
    // Only use legacy if GenerationLog is truly empty
    // (not just zero usage this month)
    const hasAnyLogs = await prisma.generationLog.count({
      where: { shop },
    });
    if (hasAnyLogs === 0) {
      freeUsageCount = legacyCount;
    }
  }

  return {
    hasQuota: freeUsageCount < freeQuota,
    subscription: null,
    usageThisCycle: freeUsageCount,
    includedQuota: freeQuota,
    overagesThisCycle: 0,
    overagesRemaining: 0,
    percentUsed: Math.min((freeUsageCount / freeQuota) * 100, 100),
    isInTrial: false,
    trialEndsAt: null,
  };
}
```

### 2. Add Import

At top of file:
```typescript
// No new imports needed - prisma already imported
```

### 3. Remove Trial Logic

**Delete lines 429-444** (trial check):
```typescript
// DELETE: Trial check entirely (handled in Phase 2)
const trial = await getTrialStatus(shop);
if (trial.isInTrial && trial.usageRemaining > 0) {
  return { ... };
}
```

### 4. Simplify Return Type

Update `QuotaCheck` type in `app/types/billing.ts`:

```typescript
export interface QuotaCheck {
  hasQuota: boolean;
  subscription: Subscription | null;
  usageThisCycle: number;
  includedQuota: number;
  overagesThisCycle: number;
  overagesRemaining: number;
  percentUsed: number;
  // REMOVE these trial fields:
  // isInTrial: boolean;
  // trialEndsAt: Date | null;
}
```

### 5. Update Callers

Components using `quota.isInTrial` or `quota.trialEndsAt`:
- `UsageDashboard.tsx` - Remove trial display logic
- `UsageAlertBanner.tsx` - Remove trial checks

## Todo List

- [ ] Update checkQuota free tier logic
- [ ] Add GenerationLog fallback for migration
- [ ] Remove trial fields from QuotaCheck type
- [ ] Update UsageDashboard component
- [ ] Update UsageAlertBanner component
- [ ] Test free user quota check
- [ ] Test migration fallback works

## Success Criteria

- [ ] Free user with 3 GenerationLog records → 3/5 usage
- [ ] Free user hard-deletes section → still 3/5 usage
- [ ] New shop with no GenerationLog → fallback to Section.count
- [ ] Paid user → unchanged behavior

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Empty GenerationLog for new shops | High | Medium | Fallback logic |
| Query performance | Low | Low | Indexed columns |
| Type errors from removed fields | Medium | Low | TS will catch at compile |

## Security Considerations

- No security changes - same shop-scoped queries
- GenerationLog immutable by design

## Next Steps

→ Phase 5: Testing and validation
