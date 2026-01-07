---
title: "Fix Billing/Usage Tracking Bugs + Remove Trial"
description: "Fix paid user tracking, create GenerationLog, remove Trial system for simpler Free → Paid flow"
status: pending
priority: P1
effort: 8h
branch: main
tags: [billing, usage-tracking, bug-fix, trial-removal, simplification]
created: 2026-01-07
---

# Billing/Usage Tracking Bug Fix + Trial Removal

## Problem Summary

| Bug | Impact | Root Cause |
|-----|--------|------------|
| **Paid users never tracked** | Unlimited generations, no overage charges | `trackGeneration()` defined but never called |
| **Free tier abuse vector** | Hard-delete removes usage evidence | Counts `Section.count()` instead of immutable log |
| **Trial adds complexity** | Extra code paths, confusing UX | Separate Trial model overlaps with Free tier |

## Solution Overview

1. **Remove Trial system entirely** - Simplify to Free → Paid flow
2. **Create GenerationLog model** - Immutable record of all AI generations
3. **Call trackGeneration() for paid users** - Fix SSE route
4. **Update free tier counting** - Use GenerationLog instead of Section.count()

## Simplification Benefit

**Before**: 3 tiers (Trial → Free → Paid) with separate tracking logic
**After**: 2 tiers (Free → Paid) with unified GenerationLog

| Removed | Replacement |
|---------|-------------|
| `Trial` model | — (deleted) |
| `incrementTrialUsage()` | GenerationLog counter |
| `getTrialStatus()` | `checkQuota()` only |
| `startTrial()` | — (deleted) |
| `TrialBanner` component | — (deleted) |

## Implementation Phases

| # | Phase | Effort | Link |
|---|-------|--------|------|
| 1 | Schema: Add GenerationLog, remove Trial | 1.5h | [phase-01-schema.md](phase-01-schema.md) |
| 2 | Remove Trial: Clean up trial code | 1.5h | [phase-02-remove-trial.md](phase-02-remove-trial.md) |
| 3 | SSE: Track all generations | 2h | [phase-03-sse-tracking.md](phase-03-sse-tracking.md) |
| 4 | Billing: Update checkQuota | 2h | [phase-04-billing-update.md](phase-04-billing-update.md) |
| 5 | Testing: Validate all paths | 1h | [phase-05-testing.md](phase-05-testing.md) |

## Key Files Modified

**Delete**: `app/services/trial.server.ts`, `app/components/billing/TrialBanner.tsx`
**Modify**: `api.chat.stream.tsx`, `billing.server.ts`, `app._index.tsx`, `schema.prisma`
**Create**: `generation-log.server.ts`, `GenerationLog` model

## Success Criteria

- [ ] No Trial code remains in codebase
- [ ] All generations create immutable GenerationLog record
- [ ] Paid users: trackGeneration called, usageThisCycle incremented
- [ ] Free users: GenerationLog count used for quota (not Section.count)
- [ ] Hard-deleting sections does NOT restore quota

## Validation Summary

**Validated**: 2026-01-07
**Questions Asked**: 5

### Confirmed Decisions

| Decision | User Choice |
|----------|-------------|
| Existing Trial users | Treat as Free immediately |
| Trial table | **Delete entirely** (not archive) |
| Free tier billing cycle | **Rolling 30 days** (not calendar month) |
| UI bug investigation | Proceed with fix (GenerationLog solves it) |
| Hard delete for free tier | Allow (GenerationLog tracks anyway) |

### Action Items (Plan Updates Needed)

- [ ] Phase 1: Add migration to DROP Trial table (not just deprecate)
- [ ] Phase 4: Change billing cycle from calendar month to rolling 30 days
- [ ] Update getBillingCycleStart() to use `new Date(Date.now() - 30*24*60*60*1000)`
