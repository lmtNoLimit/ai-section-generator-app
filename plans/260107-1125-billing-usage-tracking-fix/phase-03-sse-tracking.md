# Phase 3: Fix SSE Route Tracking

**Effort**: 2h | **Priority**: Critical | **Status**: Pending

## Context
- Parent: [plan.md](plan.md)
- Depends on: Phase 1 (schema), Phase 2 (trial removal)

## Overview

Fix the core bug: track ALL generations in GenerationLog, call trackGeneration() for paid users.

## Key Insights

- Current: Only trial users tracked, paid users skip entirely
- Bug: `trackGeneration()` defined but never called
- Fix: Log all generations, call trackGeneration for paid subscriptions

## Requirements

**Functional**:
- All AI generations create GenerationLog record
- Paid users: call trackGeneration (increments usageThisCycle)
- Free users: only create GenerationLog (no Shopify charge)

**Non-functional**:
- Graceful degradation if logging fails
- Don't block generation on tracking errors

## Architecture

```
Code Extracted → Log Generation → Track Usage (if paid)
       ↓              ↓                  ↓
  extraction.hasCode  GenerationLog    usageThisCycle++
```

## Related Code Files

**Create**:
- `app/services/generation-log.server.ts` - New logging service

**Modify**:
- `app/routes/api.chat.stream.tsx` - Add tracking logic

## Implementation Steps

### 1. Create generation-log.server.ts

**File**: `app/services/generation-log.server.ts`

```typescript
/**
 * Generation Log Service
 * Immutable audit trail for all AI generations
 */

import prisma from "../db.server";
import type { Subscription } from "@prisma/client";

interface LogGenerationInput {
  shop: string;
  sectionId: string;
  messageId?: string;
  prompt: string;
  tokenCount?: number;
  modelId?: string;
  userTier: "free" | "pro" | "agency";
  wasCharged?: boolean;
}

/**
 * Create immutable generation log entry
 * Called after successful code extraction
 */
export async function logGeneration(input: LogGenerationInput) {
  const billingCycle = getBillingCycleStart();

  return await prisma.generationLog.create({
    data: {
      shop: input.shop,
      sectionId: input.sectionId,
      messageId: input.messageId,
      prompt: input.prompt.slice(0, 500), // Truncate
      tokenCount: input.tokenCount,
      modelId: input.modelId ?? "gemini-2.5-flash",
      userTier: input.userTier,
      billingCycle,
      wasCharged: input.wasCharged ?? false,
    },
  });
}

/**
 * Get billing cycle start (calendar month for free, Shopify cycle for paid)
 */
export function getBillingCycleStart(subscription?: Subscription | null): Date {
  if (subscription?.currentPeriodEnd) {
    // Paid: cycle start = period end - 30 days
    const cycleStart = new Date(subscription.currentPeriodEnd);
    cycleStart.setDate(cycleStart.getDate() - 30);
    cycleStart.setHours(0, 0, 0, 0);
    return cycleStart;
  }

  // Free: calendar month start
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  return startOfMonth;
}

/**
 * Count generations for shop in current billing cycle
 */
export async function countGenerationsThisCycle(shop: string): Promise<number> {
  const billingCycle = getBillingCycleStart();

  return await prisma.generationLog.count({
    where: {
      shop,
      generatedAt: { gte: billingCycle },
    },
  });
}
```

### 2. Update api.chat.stream.tsx

**Replace lines 168-171** with:

```typescript
// Track generation for ALL tiers when code is generated
if (extraction.hasCode) {
  try {
    const subscription = await getSubscription(shop);
    const userTier = subscription?.planName ?? "free";

    // Determine if this is an overage charge
    const isOverage = subscription &&
      subscription.usageThisCycle >= subscription.includedQuota;

    // 1. Create immutable log (all tiers)
    await logGeneration({
      shop,
      sectionId: conversation.sectionId,
      messageId: assistantMessage.id,
      prompt: sanitizedContent,
      tokenCount,
      userTier: userTier as "free" | "pro" | "agency",
      wasCharged: isOverage,
    });

    // 2. Track usage for PAID users only (BUG FIX)
    if (subscription) {
      await trackGeneration(
        admin,
        shop,
        conversation.sectionId,
        sanitizedContent
      );
    }
  } catch (error) {
    // Log error but don't block generation
    console.error("[api.chat.stream] Failed to track generation:", error);
  }
}
```

**Add imports at top**:
```typescript
import { logGeneration } from "../services/generation-log.server";
import { trackGeneration } from "../services/usage-tracking.server";
import { getSubscription } from "../services/billing.server";
```

**Update action signature**:
```typescript
export async function action({ request }: ActionFunctionArgs) {
  const { session, admin } = await authenticate.admin(request);
  // ... rest unchanged
```

## Todo List

- [ ] Create generation-log.server.ts
- [ ] Add logGeneration function
- [ ] Add countGenerationsThisCycle function
- [ ] Update api.chat.stream.tsx imports
- [ ] Update action to get admin context
- [ ] Replace tracking block with new logic
- [ ] Test free user generation
- [ ] Test paid user generation

## Success Criteria

- [ ] Free user: GenerationLog created, no Shopify charge
- [ ] Pro user: GenerationLog created, trackGeneration called
- [ ] Agency user: Same as Pro
- [ ] Error in tracking doesn't block generation
- [ ] usageThisCycle increments for paid users

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| trackGeneration fails | Low | Medium | Graceful degradation, FailedUsageCharge table |
| Duplicate logs | Low | Low | Logs are append-only, duplicates acceptable |
| Performance impact | Low | Low | Single DB insert per generation |

## Security Considerations

- Prompt truncated to 500 chars before storage
- Shop-scoped queries prevent cross-tenant access
- No sensitive data in GenerationLog

## Next Steps

→ Phase 4: Update checkQuota to use GenerationLog
