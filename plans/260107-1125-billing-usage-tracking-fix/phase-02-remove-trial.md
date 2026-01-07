# Phase 2: Remove Trial System

**Effort**: 1.5h | **Priority**: High | **Status**: Pending

## Context
- Parent: [plan.md](plan.md)
- Depends on: Phase 1 (schema)

## Overview

Remove all Trial-related code. Users now go directly to Free tier (5 generations/month).

## Key Insights

- Trial was 7 days, 10 generations, Pro features
- Free tier is unlimited time, 5 generations/month, basic features
- Simplifies billing from 3 tiers to 2 tiers
- Reduces ~300 lines of code

## Requirements

- Remove Trial service, components, and references
- Update routes that auto-start trial
- Keep Trial table for historical data (don't delete)
- Existing trial users treated as Free

## Files to Delete

| File | Lines | Purpose |
|------|-------|---------|
| `app/services/trial.server.ts` | 158 | Trial service |
| `app/services/__tests__/trial.server.test.ts` | ~200 | Trial tests |
| `app/components/billing/TrialBanner.tsx` | 55 | Trial UI |

## Files to Modify

### 1. `app/routes/app._index.tsx`

**Remove** (lines 13, 43-51, 170-177):
```typescript
// DELETE: Trial imports
import { getTrialStatus, startTrial, type TrialStatus } from "../services/trial.server";

// DELETE: Trial auto-start logic (lines 43-51)
let trialStatus = await getTrialStatus(shop);
if (trialStatus.status === "none") {
  const subscription = await getSubscription(shop);
  if (!subscription) {
    trialStatus = await startTrial(shop);
  }
}

// DELETE: TrialBanner (lines 170-177)
{trialStatus.isInTrial && (
  <TrialBanner ... />
)}

// DELETE: from return object
trialStatus,
```

**Keep**: Rest of homepage unchanged.

### 2. `app/routes/api.chat.stream.tsx`

**Remove** (lines 9, 56-70):
```typescript
// DELETE: Trial import
import { getTrialStatus, incrementTrialUsage } from "../services/trial.server";

// DELETE: Trial gate check (lines 56-70)
const trialStatus = await getTrialStatus(shop);
if (trialStatus.isInTrial && trialStatus.usageRemaining <= 0) {
  return new Response(...);
}

// DELETE: Trial usage increment (line 170)
if (extraction.hasCode && trialStatus.isInTrial) {
  await incrementTrialUsage(shop);
}
```

### 3. `app/services/billing.server.ts`

**Remove** (lines 20, 429, 431-444):
```typescript
// DELETE: Trial import
import { getTrialStatus, convertTrial } from "./trial.server";

// DELETE: Trial check in checkQuota (lines 431-444)
const trial = await getTrialStatus(shop);
if (trial.isInTrial && trial.usageRemaining > 0) {
  return { ... };
}

// DELETE: convertTrial call in createSubscription (line 154)
await convertTrial(shop, planName);
```

### 4. `app/services/feature-gate.server.ts`

**Remove** trial-related feature checks:
```typescript
// DELETE: Trial import and logic
import { getTrialStatus } from "./trial.server";

// Simplify hasFeature to only check subscription
```

### 5. `app/components/billing/index.ts`

**Remove** TrialBanner export:
```typescript
// DELETE
export { TrialBanner } from "./TrialBanner";
```

## Implementation Steps

1. Delete trial.server.ts and its test file
2. Delete TrialBanner.tsx
3. Update app._index.tsx - remove trial logic
4. Update api.chat.stream.tsx - remove trial gate
5. Update billing.server.ts - remove trial from checkQuota
6. Update feature-gate.server.ts - remove trial checks
7. Update component barrel export
8. Run `npm run lint` to catch missed references
9. Run `npm test` to verify no breaks

## Todo List

- [ ] Delete trial.server.ts
- [ ] Delete trial.server.test.ts
- [ ] Delete TrialBanner.tsx
- [ ] Update app._index.tsx
- [ ] Update api.chat.stream.tsx
- [ ] Update billing.server.ts
- [ ] Update feature-gate.server.ts
- [ ] Update component exports
- [ ] Run lint check
- [ ] Run tests

## Success Criteria

- [ ] No "trial" references in codebase (except schema comment)
- [ ] npm run lint passes
- [ ] npm test passes
- [ ] Homepage loads without trial banner

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Missed reference | Medium | Low | Lint + grep check |
| Existing trial users confused | Low | Medium | Treat as Free silently |

## Next Steps

→ Phase 3: SSE tracking fix
